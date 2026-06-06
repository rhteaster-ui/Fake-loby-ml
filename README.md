# Fake-loby-ml

Frontend + Vercel API wrapper untuk package [`fake-ml`](https://www.npmjs.com/package/fake-ml).

## Flow Aplikasi

1. User memilih avatar, username, rank, dan border di `index.html`.
2. Frontend mengirim request JSON ke `/api/generate`.
3. API memanggil package `fake-ml` dengan parameter:
   - `avatar` (opsional; default bawaan package jika user tidak upload foto)
   - `username` maksimal 15 karakter
   - `rank`
   - `border`
4. File PNG sementara dibuat di `/tmp` agar aman untuk runtime serverless Vercel.
5. API mengembalikan gambar dalam bentuk `data:image/png;base64,...` untuk preview dan download di frontend.

## Installation

```bash
npm install fake-ml
```

## Usage

```js
const generateCard = require('fake-ml')

const result = await generateCard({
  avatar: 'https://example.com/avatar.jpg',
  username: 'Ditzzx',
  rank: 'imo',
  border: 1
})

console.log(result)
// {
//   status: 'success',
//   code: 200,
//   avatar: 'https://example.com/avatar.jpg',
//   username: 'Ditzzx',
//   rank: 'imo',
//   border: 1,
//   result: '/path/to/fm_123456.png'
// }
```

## Parameters

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `avatar` | string | No | default | URL foto avatar atau data URL image base64 |
| `username` | string | No | Player | Nama player (max 15 karakter) |
| `rank` | string | No | imo | Nama rank |
| `border` | number | No | 0 | Nomor border (0 = outline default) |

## Available Ranks

| Rank | Key |
| --- | --- |
| Epic | `epic` |
| Glory | `glory` |
| Grandmaster | `gm` |
| Honor | `honor` |
| Immortal | `imo` |
| Legend | `legend` |
| Mawi | `mawi` |

## Available Borders

| Border | Preview |
| --- | --- |
| 1 | Border 1 |
| 2 | Border 2 |
| 3 | Border 3 |
| 4 | Border 4 |
| 5 | Border 5 |
| 6 | Border 6 |
| 7 | Border 7 |
| 8 | Border 8 |
| 9 | Border 9 |
| 10 | Border 10 |
| 11 | Border 11 |
| 12 | Border 12 |
| 13 | Border 13 |
| 14 | Border 14 |
| 15 | Border 15 |
| 16 | Border 16 |

Border `0` = outline default warna gold `#b8956f`.

## Vercel Deploy Notes

- API utama: `POST /api/generate`.
- Preview asset frontend: `GET /api/asset?type=rank&id=imo` dan `GET /api/asset?type=border&id=1`.
- Output gambar temporary ditulis ke `/tmp`, bukan folder project, supaya kompatibel dengan serverless Vercel.
- Frontend tidak lagi wajib upload avatar ke hosting eksternal; avatar lokal dikirim langsung sebagai data URL ke `/api/generate`.
