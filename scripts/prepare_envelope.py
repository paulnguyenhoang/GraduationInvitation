"""Build the prototype GLB from the two original Sketchfab downloads."""

from collections import defaultdict
from pathlib import Path
import json
import math
import random
import struct
import zlib


MODELS = Path(__file__).resolve().parents[1] / 'public/assets/models'
FOLD = 12.10  # Source mesh coordinates, just above the original crease.
PIVOT = (0, (FOLD - 6) / 10, 0.003)


def read_glb(name):
    data = (MODELS / name).read_bytes()
    magic, version, size, json_size, chunk = struct.unpack_from('<4sIII4s', data)
    if (magic, version, size, chunk) != (b'glTF', 2, len(data), b'JSON'):
        raise ValueError(f'Unexpected GLB header in {name}')
    return json.loads(data[20:20 + json_size]), data[28 + json_size:]


def primitive(source, name):
    doc, data = source
    mesh = next(mesh for mesh in doc['meshes'] if mesh['name'] == name)
    part, = mesh['primitives']

    def read(index, fmt, kind):
        accessor = doc['accessors'][index]
        view = doc['bufferViews'][accessor['bufferView']]
        if accessor['componentType'] != kind or 'sparse' in accessor:
            raise ValueError(f'Unexpected accessor in {name}')
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        stride = view.get('byteStride', struct.calcsize(fmt))
        return [struct.unpack_from(fmt, data, offset + i * stride)
                for i in range(accessor['count'])]

    attributes = part['attributes']
    positions = read(attributes['POSITION'], '<3f', 5126)
    normals = read(attributes['NORMAL'], '<3f', 5126)
    indices = [index for index, in read(part['indices'], '<I', 5125)]
    return positions, normals, indices


def unit(vector):
    length = math.hypot(*vector)
    return tuple(value / length for value in vector)


def cut_polygon(vertices, keep_top):
    result = []
    for (a, an), (b, bn) in zip(vertices[-1:] + vertices[:-1], vertices):
        inside_a = (a[2] >= FOLD) == keep_top
        inside_b = (b[2] >= FOLD) == keep_top
        if inside_a != inside_b:
            t = (FOLD - a[2]) / (b[2] - a[2])
            pos = tuple(a[i] + t * (b[i] - a[i]) for i in range(2)) + (FOLD,)
            normal = unit(tuple(an[i] + t * (bn[i] - an[i]) for i in range(3)))
            result.append((pos, normal))
        if inside_b:
            result.append((b, bn))
    return result


def cross(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def triangulate_cap(points):
    """Ear clipping on the thin, closed cross section of the paper hinge."""
    remaining = list(points)
    area = sum(a[0] * b[1] - b[0] * a[1]
               for a, b in zip(points, points[1:] + points[:1]))
    if area < 0:
        remaining.reverse()
    triangles = []
    while len(remaining) > 3:
        for i, b in enumerate(remaining):
            a, c = remaining[i - 1], remaining[(i + 1) % len(remaining)]
            if cross(a, b, c) <= 1e-13:
                continue
            if any(min(cross(a, b, p), cross(b, c, p), cross(c, a, p)) >= 0
                   for p in remaining if p not in (a, b, c)):
                continue
            triangles.append((a, b, c))
            remaining.pop(i)
            break
        else:
            raise ValueError('The hinge cross section could not be capped safely')
    triangles.append(tuple(remaining))
    return triangles


def split_envelope(positions, normals, indices):
    body, flap = [], []
    boundary = defaultdict(set)
    for offset in range(0, len(indices), 3):
        triangle = [(positions[i], normals[i]) for i in indices[offset:offset + 3]]
        for keep_top, surface in ((False, body), (True, flap)):
            polygon = cut_polygon(triangle, keep_top)
            surface.extend(vertex for i in range(1, len(polygon) - 1)
                           for vertex in (polygon[0], polygon[i], polygon[i + 1]))
            if keep_top:
                cut = [tuple(round(v, 7) for v in p[:2]) for p, _ in polygon if p[2] == FOLD]
                if len(cut) == 2:
                    a, b = cut
                    boundary[a].add(b)
                    boundary[b].add(a)
    if not boundary or any(len(edges) != 2 for edges in boundary.values()):
        raise ValueError('The hinge cut did not produce a closed edge loop')
    first = min(boundary)
    loop = [first, min(boundary[first])]
    while True:
        next_point, = boundary[loop[-1]] - {loop[-2]}
        if next_point == first:
            break
        loop.append(next_point)
    if len(loop) != len(boundary):
        raise ValueError('The hinge contains more than one edge loop')
    for triangle in triangulate_cap(loop):
        body.extend(((x, y, FOLD), (0, 0, 1)) for x, y in triangle)
        flap.extend(((x, y, FOLD), (0, 0, -1)) for x, y in reversed(triangle))
    return body, flap


def png(size, channels, pixels):
    def chunk(kind, content):
        return (struct.pack('>I', len(content)) + kind + content
                + struct.pack('>I', zlib.crc32(kind + content)))

    stride = size * channels
    rows = b''.join(b'\0' + pixels[i:i + stride] for i in range(0, len(pixels), stride))
    header = struct.pack('>IIBBBBB', size, size, 8, {1: 0, 3: 2}[channels], 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header)
            + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


def paper_grain():
    noise = random.Random(45)
    return png(128, 1, bytes(round(247 + noise.triangular(-8, 8)) for _ in range(128 ** 2)))


def wax_stamp():
    # A serif V with offset highlight and shadow for the impression in the wax.
    outline = [(0.31, 0.31), (0.49, 0.31), (0.49, 0.33), (0.45, 0.34),
               (0.55, 0.58), (0.64, 0.35), (0.60, 0.33), (0.60, 0.31),
               (0.73, 0.31), (0.73, 0.33), (0.68, 0.35), (0.54, 0.68),
               (0.51, 0.68), (0.35, 0.35), (0.31, 0.33)]

    def inside(x, y):
        return sum((b[1] > y) != (a[1] > y) and
                   x < (a[0] - b[0]) * (y - b[1]) / (a[1] - b[1]) + b[0]
                   for a, b in zip(outline, outline[-1:] + outline[:-1])) % 2

    noise = random.Random(180)
    pixels = bytearray()
    for row in range(192):
        for column in range(192):
            x, y = (column + .5) / 192, (row + .5) / 192
            edge = inside(x + .006, y + .007) - inside(x - .005, y - .006)
            relief = edge * 9 - inside(x, y) * 18
            tone = relief + 3 * math.sin(x * 13 + y * 9) + noise.uniform(-2, 2)
            pixels.extend(round(value + tone) for value in (134, 64, 55))
    return png(192, 3, pixels)


class Export:
    def __init__(self):
        self.binary = bytearray()
        self.doc = {key: [] for key in ('bufferViews', 'accessors', 'meshes', 'images', 'textures')}

    def view(self, data, **fields):
        self.binary.extend(b'\0' * (-len(self.binary) % 4))
        views = self.doc['bufferViews']
        views.append(dict(buffer=0, byteOffset=len(self.binary), byteLength=len(data), **fields))
        self.binary.extend(data)
        return len(views) - 1

    def accessor(self, data, fmt, kind, **fields):
        vertex_attribute = kind == 5126
        dimensions = len(data[0])
        target = 34962 if vertex_attribute else 34963
        view = self.view(b''.join(struct.pack(fmt, *value) for value in data), target=target)
        accessors = self.doc['accessors']
        accessors.append(dict(bufferView=view, componentType=kind, count=len(data),
                              type={1: 'SCALAR', 2: 'VEC2', 3: 'VEC3'}[dimensions], **fields))
        return len(accessors) - 1

    def texture(self, name, data):
        index = len(self.doc['images'])
        self.doc['images'].append(dict(name=name, bufferView=self.view(data), mimeType='image/png'))
        self.doc['textures'].append(dict(source=index))

    def mesh(self, name, material, positions, normals, uv, indices=None):
        attributes = dict(
            POSITION=self.accessor(positions, '<3f', 5126,
                                   min=list(map(min, zip(*positions))), max=list(map(max, zip(*positions)))),
            NORMAL=self.accessor(normals, '<3f', 5126),
            TEXCOORD_0=self.accessor(uv, '<2f', 5126),
        )
        part = dict(attributes=attributes, material=material)
        if indices is not None:
            part['indices'] = self.accessor([(i,) for i in indices], '<H', 5123)
        self.doc['meshes'].append(dict(name=name, primitives=[part]))

    def write(self, destination):
        self.doc['buffers'] = [dict(byteLength=len(self.binary))]
        manifest = json.dumps(self.doc, separators=(',', ':')).encode()
        manifest += b' ' * (-len(manifest) % 4)
        binary = self.binary + b'\0' * (-len(self.binary) % 4)
        destination.write_bytes(struct.pack('<4sIII4s', b'glTF', 2, 28 + len(manifest) + len(binary),
                                            len(manifest), b'JSON') + manifest
                                + struct.pack('<I4s', len(binary), b'BIN\0') + binary)


def material(name, color, texture, roughness, double_sided=False):
    # glTF baseColorFactor uses linear RGB.
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in color]
    return dict(name=name, doubleSided=double_sided, pbrMetallicRoughness=dict(
        baseColorFactor=[*linear, 1], baseColorTexture=dict(index=texture),
        metallicFactor=0, roughnessFactor=roughness))


def main():
    envelope = read_glb('free_blank_greeting_card_with_envelope.glb')
    seal = read_glb('letter__envelope_assets.glb')
    body, flap = split_envelope(*primitive(envelope, 'EnvelopeFREE_wire_086086086_0'))
    asset = Export()
    asset.texture('Paper grain', paper_grain())
    asset.texture('Wax monogram V', wax_stamp())
    for name, vertices, pivot in (('EnvelopeBody', body, (0, 0, 0)), ('EnvelopeFlap', flap, PIVOT)):
        mapped = [((x + 43.55) / 10, (z - 6) / 10, -y / 10) for (x, y, z), _ in vertices]
        local = [tuple(v[i] - pivot[i] for i in range(3)) for v in mapped]
        asset.mesh(name, 0, local, [(x, z, -y) for _, (x, y, z) in vertices],
                   [(x * 2, y * 2) for x, y, _ in mapped])

    paper, normals, indices = primitive(envelope, 'LetterFREE__0')
    card = [(x * .096, (y + 5.5) / 10 + .001, z / 10) for x, y, z in paper]
    asset.mesh('InvitationCard', 1, card, normals, [(x * 2, y * 2) for x, y, _ in card], indices)

    wax, normals, indices = primitive(seal, 'pCylinder17_Seal_0')
    wax = [((x + 9.743263) * .42, (y - 2.65055) * .42, (z + 108.9155884) * .15)
           for x, y, z in wax]
    wax_normals = [unit((x / .42, y / .42, z / .15)) for x, y, z in normals]
    asset.mesh('WaxSeal', 2, wax, wax_normals, [(x / .34 + .5, .5 - y / .34) for x, y, _ in wax], indices)

    asset.doc.update(
        asset=dict(version='2.0', generator='GraduationInvitation / prepare_envelope.py',
                   extras=dict(sources=[source[0]['asset']['extras'] for source in (envelope, seal)],
                               changes='Hinged flap, assembly, cream paper, V wax seal and web textures.')),
        scene=0,
        scenes=[dict(nodes=[0, 1, 2])],
        nodes=[dict(name='EnvelopeBody', mesh=0),
               dict(name='FlapHinge', translation=PIVOT, mesh=1, children=[3]),
               dict(name='InvitationCard', mesh=2, translation=[0, -.551, 0]),
               dict(name='WaxSeal', mesh=3, translation=[0, .667, -.048], rotation=[1, 0, 0, 0])],
        materials=[material('Cream paper', (.94, .86, .74), 0, .96, True),
                   material('Ivory card', (1, .94, .83), 0, .93),
                   material('Warm red wax', (1, 1, 1), 1, .53)],
    )
    destination = MODELS / 'envelope-prototype.glb'
    asset.write(destination)
    print(f'{destination.name} · {destination.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
