import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { emptyDirectory, mergeDirectory, readDirectory, withoutBlocksFrom, type Directory } from "@/lib/directory"
import { supabase } from "@/lib/supabase"

function storePath() {
  if (process.env.VERCEL) return "/tmp/partner-directory.json"
  return path.join(process.cwd(), ".data", "partner-directory.json")
}

let memoryStore: Directory = emptyDirectory
let queue = Promise.resolve<Directory>(emptyDirectory)

// Supabase fallback
async function readSupabase(): Promise<Directory> {
  if (!supabase) return emptyDirectory
  
  const now = Date.now()
  const cutoff = new Date(now - 2 * 60 * 60 * 1000).toISOString() // 2h

  const [profiles, likes, blocks] = await Promise.all([
    supabase.from("directory").select("*").gte("seen_at", cutoff).order("seen_at", { ascending: false }).limit(60),
    supabase.from("likes").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("blocks").select("*").limit(300),
  ])

  return {
    profiles: (profiles.data || []).map((p) => ({
      id: p.device_id,
      name: p.name,
      age: p.age,
      city: p.city,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      gender: p.gender as any,
      attractedTo: p.attracted_to as any,
      sexuality: p.sexuality as any,
      seen: new Date(p.seen_at).getTime(),
    })),
    likes: (likes.data || []).map((l) => ({
      by: l.from_device,
      target: l.to_device,
      at: new Date(l.created_at).getTime(),
    })),
    blocks: (blocks.data || []).map((b) => ({
      by: b.by_device,
      target: b.target_device,
    })),
  }
}

async function writeSupabase(directory: Directory): Promise<void> {
  if (!supabase) return

  // Upsert profiles
  const profileData = directory.profiles.map((p) => ({
    device_id: p.id,
    name: p.name,
    age: p.age,
    city: p.city,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    gender: p.gender,
    attracted_to: p.attractedTo,
    sexuality: p.sexuality,
    seen_at: new Date(p.seen).toISOString(),
  }))
  
  if (profileData.length > 0) {
    await supabase.from("directory").upsert(profileData, { onConflict: "device_id" })
  }

  // Upsert likes (batch)
  const likeData = directory.likes.map((l) => ({
    from_device: l.by,
    to_device: l.target,
    created_at: new Date(l.at).toISOString(),
  }))
  
  if (likeData.length > 0) {
    await supabase.from("likes").upsert(likeData, { onConflict: "from_device,to_device" })
  }

  // Upsert blocks
  const blockData = directory.blocks.map((b) => ({
    by_device: b.by,
    target_device: b.target,
  }))
  
  if (blockData.length > 0) {
    await supabase.from("blocks").upsert(blockData, { onConflict: "by_device,target_device" })
  }
}

function enqueue(task: (current: Directory) => Promise<Directory> | Directory) {
  const run = queue.then(task, task)
  queue = run.then(
    (directory) => directory,
    async () => readStored(),
  )
  return run
}

async function readStored() {
  // Try Supabase first
  if (supabase) {
    try {
      return await readSupabase()
    } catch (error) {
      console.error("Supabase read error:", error)
    }
  }
  
  // Fallback to memory (Vercel)
  if (process.env.VERCEL) {
    return memoryStore
  }
  
  // Fallback to file (local)
  try {
    return readDirectory(JSON.parse(await readFile(storePath(), "utf8")))
  } catch {
    return emptyDirectory
  }
}

async function writeStored(directory: Directory) {
  // Write to Supabase
  if (supabase) {
    try {
      await writeSupabase(directory)
    } catch (error) {
      console.error("Supabase write error:", error)
    }
  }
  
  // Also write to memory (Vercel) or file (local)
  if (process.env.VERCEL) {
    memoryStore = directory
  } else {
    const file = storePath()
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(directory), "utf8")
  }
  
  return directory
}

export function loadDirectory() {
  return enqueue(async (current) => {
    const stored = mergeDirectory(current, await readStored())
    return writeStored(stored)
  })
}

export function saveDirectory(incoming: Directory) {
  return enqueue(async (current) => {
    const stored = mergeDirectory(mergeDirectory(current, await readStored()), incoming)
    return writeStored(stored)
  })
}

export function clearBlocksFrom(deviceId: string) {
  return enqueue(async (current) => {
    const stored = withoutBlocksFrom(mergeDirectory(current, await readStored()), deviceId)
    return writeStored(stored)
  })
}
