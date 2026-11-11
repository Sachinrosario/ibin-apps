"""Index of a picture pack made of uncompressed (stored) zip files, so the programs can fetch one picture at a time
from the GitHub release with an HTTP Range request.  usage: python3 pack_index.py out.json part1.zip part2.zip ...
Output: {"parts": [file names], "f": {"Images/x/y.jpg": [part number, data offset, size], ...}}"""
import json, struct, sys, zipfile, os
out, zips = sys.argv[1], sys.argv[2:]
idx = {'parts': [os.path.basename(z) for z in zips], 'f': {}}
for pi, z in enumerate(zips):
    with zipfile.ZipFile(z) as zf, open(z, 'rb') as fh:
        for i in zf.infolist():
            if i.is_dir(): continue
            if i.compress_type != zipfile.ZIP_STORED: raise SystemExit(f'{i.filename} in {z} is compressed')
            fh.seek(i.header_offset); h = fh.read(30)
            if h[:4] != b'PK\x03\x04': raise SystemExit('bad local header ' + i.filename)
            n, e = struct.unpack('<HH', h[26:30])
            idx['f'][i.filename] = [pi, i.header_offset + 30 + n + e, i.file_size]
json.dump(idx, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(idx['f']), 'files indexed')
