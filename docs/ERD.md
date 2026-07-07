# Entity Relationship Diagram — Entrust Prayers

## Diagram

```
┌─────────────────────┐         ┌─────────────────────────┐
│   auth.users (SUPA) │ 1───1   │        profiles         │
│  id (uuid) PK       │◄────────┤  id (uuid) PK → users.id│
│  email              │         │  email                   │
└─────────────────────┘         │  full_name               │
                                │  avatar_url              │
                                │  city                    │
                                │  bio                     │
                                │  role: penitip|pendoa|adm│
                                │  created_at              │
                                └────────────┬─────────────┘
                                             │ 1
                                             │
                                             │ N
                                ┌────────────▼─────────────┐
                                │      pilgrimages         │
                                │  id (uuid) PK            │
                                │  user_id → profiles.id   │
                                │  type: haji|umroh        │
                                │  departure_date          │
                                │  return_date             │
                                │  description             │
                                │  status: draft|active|   │
                                │         finished         │
                                │  created_at              │
                                └────────────┬─────────────┘
                                             │ 1
                                             │
                                             │ N
┌─────────────────────┐         ┌────────────▼─────────────┐
│      prayers        │         │                          │
│  id (uuid) PK       │◄────────┤  receiver_id → profiles  │
│  sender_id → prof   │         │  pilgrimage_id → pilgrim │
│  receiver_id → prof │         │                          │
│  pilgrimage_id →pil │         └──────────────────────────┘
│  title              │
│  content            │         ┌──────────────────────────┐
│  is_private bool    │◄────────┤   notifications          │
│  is_anonymous bool  │         │  id (uuid) PK            │
│  status: pending|   │         │  user_id → profiles.id   │
│    accepted|prayed| │         │  title                   │
│    completed        │         │  message                 │
│  created_at         │         │  is_read bool            │
└─────────────────────┘         │  created_at              │
                                └──────────────────────────┘
```

## Relasi

| Dari          | Ke            | Tipe | Keterangan                                       |
| ------------- | ------------- | ---- | ------------------------------------------------ |
| profiles.id   | auth.users.id | 1—1  | Trigger `handle_new_user` membuat profile auto   |
| pilgrimages   | profiles      | N—1  | Satu pendoa bisa punya banyak perjalanan ibadah  |
| prayers       | profiles      | N—1  | `sender_id` — penitip doa                        |
| prayers       | profiles      | N—1  | `receiver_id` — pendoa                           |
| prayers       | pilgrimages   | N—1  | Doa ditujukan ke perjalanan spesifik             |
| notifications | profiles      | N—1  | Notifikasi per user                              |

## State Machine — `prayers.status`

```
┌─────────┐  PENDOA accept  ┌──────────┐  PENDOA pray  ┌────────┐  PENITIP close  ┌───────────┐
│ pending │ ──────────────► │ accepted │ ────────────► │ prayed │ ──────────────► │ completed │
└─────────┘                 └──────────┘               └────────┘                 └───────────┘
     ▲                            │
     │  PENITIP cancel            │
     └────────────────────────────┘
```

### Aturan otoritas (di-enforce di database via RPC `update_prayer_status`)

| Transisi             | Yang berhak           |
| -------------------- | --------------------- |
| `pending → accepted` | Hanya **pendoa** (receiver) |
| `* → prayed`         | Hanya **pendoa** (receiver) |
| `prayed → completed` | Hanya **penitip** (sender)  |
| `accepted → pending` | Hanya **penitip** (sender) — batal |

> Kolom `status` di tabel prayers TIDAK bisa di-update langsung oleh client.
> Hanya bisa lewat RPC `update_prayer_status()` yang me-validasi role + transisi.
> Lihat migration `20260101000700_prayer_status_rpc.sql`.

## State Machine — `pilgrimages.status`

```
┌────────┐  publish   ┌────────┐  return_date lewat  ┌──────────┐
│ draft  │ ─────────► │ active │ ──────────────────► │ finished │
└────────┘            └────────┘                     └──────────┘
```
