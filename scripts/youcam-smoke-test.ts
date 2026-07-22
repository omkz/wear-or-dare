import "dotenv/config"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import {
  createClothesTask,
  isYouCamGarmentCategory,
  pollClothesTask,
  requestFileUpload,
  uploadBytes,
  YouCamApiError,
  type YouCamGarmentCategory,
  type YouCamImageContentType,
} from "../lib/server/youcam-client"

const MAX_FILE_SIZE = 10 * 1024 * 1024

interface ValidatedImage {
  bytes: Uint8Array
  contentType: YouCamImageContentType
  fileName: string
}

function hasValidSignature(bytes: Uint8Array, contentType: YouCamImageContentType) {
  if (contentType === "image/jpg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  return signature.every((value, index) => bytes[index] === value)
}

async function validateImage(filePath: string, label: string): Promise<ValidatedImage> {
  let fileStats
  try {
    fileStats = await stat(filePath)
  } catch (cause) {
    throw new Error(`${label} file does not exist: ${filePath}`, { cause })
  }

  if (!fileStats.isFile()) throw new Error(`${label} path is not a file: ${filePath}`)
  if (fileStats.size <= 0) throw new Error(`${label} file is empty`)
  if (fileStats.size >= MAX_FILE_SIZE) throw new Error(`${label} file must be under 10 MB`)

  const extension = path.extname(filePath).toLowerCase()
  const contentType: YouCamImageContentType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpg"
        : (() => {
            throw new Error(`${label} file must be JPG or PNG`)
          })()
  const bytes = new Uint8Array(await readFile(filePath))
  if (!hasValidSignature(bytes, contentType)) {
    throw new Error(`${label} file content does not match its extension`)
  }

  return { bytes, contentType, fileName: path.basename(filePath) }
}

async function uploadImage(image: ValidatedImage, label: string) {
  const upload = await requestFileUpload({
    fileName: image.fileName,
    contentType: image.contentType,
    fileSize: image.bytes.byteLength,
  })
  await uploadBytes(upload, image.bytes)
  console.log(`${label} uploaded successfully.`)
  return upload.fileId
}

async function main() {
  const rawArguments = process.argv.slice(2)
  const argumentsList = rawArguments[0] === "--" ? rawArguments.slice(1) : rawArguments
  const [personPath, garmentPath, categoryValue, ...extraArguments] = argumentsList
  if (!personPath || !garmentPath || !categoryValue || extraArguments.length > 0) {
    throw new Error(
      "Usage: pnpm youcam:test -- <person.jpg> <garment.jpg> <auto|full_body|upper_body|lower_body|shoes>"
    )
  }
  if (!isYouCamGarmentCategory(categoryValue)) {
    throw new Error(`Invalid garment category: ${categoryValue}`)
  }

  const garmentCategory: YouCamGarmentCategory = categoryValue
  const [person, garment] = await Promise.all([
    validateImage(personPath, "Person"),
    validateImage(garmentPath, "Garment"),
  ])
  const personFileId = await uploadImage(person, "Person image")
  const garmentFileId = await uploadImage(garment, "Garment image")
  const taskId = await createClothesTask({
    sourceFileId: personFileId,
    referenceFileId: garmentFileId,
    garmentCategory,
  })

  console.log(`YouCam task created: ${taskId}`)
  const result = await pollClothesTask(taskId, {
    onStatus: ({ status }) => console.log(`YouCam task status: ${status}`),
  })
  console.log(`Result URL: ${result.resultUrl}`)
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke-test failure"
  const code = error instanceof YouCamApiError && error.errorCode
    ? ` (${error.errorCode})`
    : ""
  console.error(`YouCam smoke test failed${code}: ${message}`)
  process.exitCode = 1
})
