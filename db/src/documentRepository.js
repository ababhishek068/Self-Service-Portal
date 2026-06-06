import { getPrisma } from './client.js'

function iso(value) {
  return value instanceof Date ? value.toISOString() : value
}

function toPolicyDocument(row, includeContent = false) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    updated: row.updatedOn,
    fileName: row.fileName,
    mimeType: row.mimeType,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    ...(includeContent ? { content: row.content } : {}),
  }
}

export async function listPolicyDocuments() {
  const rows = await getPrisma().policyDocument.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })
  return rows.map((row) => toPolicyDocument(row))
}

export async function getPolicyDocument(id) {
  const row = await getPrisma().policyDocument.findUnique({ where: { id } })
  return row ? toPolicyDocument(row, true) : null
}

export async function upsertPolicyDocument(input) {
  const data = {
    title: input.title,
    category: input.category,
    updatedOn: input.updated ?? input.updatedOn ?? '',
    fileName: input.fileName,
    mimeType: input.mimeType ?? 'text/plain',
    content: input.content,
  }
  const row = await getPrisma().policyDocument.upsert({
    where: { id: input.id },
    create: { id: input.id, ...data },
    update: data,
  })
  return toPolicyDocument(row, true)
}
