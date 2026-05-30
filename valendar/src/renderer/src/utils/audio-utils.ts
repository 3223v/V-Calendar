import { createLogger } from './logger'

const log = createLogger('AudioUtils')

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

export function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitsPerSample = 16

  const data = interleaveChannels(audioBuffer)
  const dataLength = data.length * (bitsPerSample / 8)
  const headerLength = 44
  const totalLength = headerLength + dataLength

  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalLength - 8, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true)
  view.setUint16(34, bitsPerSample, true)

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write PCM samples
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(offset, intSample, true)
    offset += 2
  }

  return buffer
}

function interleaveChannels(audioBuffer: AudioBuffer): Float32Array {
  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length * numChannels
  const result = new Float32Array(length)

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel)
    for (let i = 0; i < audioBuffer.length; i++) {
      result[i * numChannels + channel] = channelData[i]
    }
  }

  return result
}

export async function webmToWav(webmBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext()

  try {
    const arrayBuffer = await webmBlob.arrayBuffer()
    log.info('Decoding WebM audio, size:', webmBlob.size, 'bytes')

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    log.info(
      'Decoded:',
      audioBuffer.duration.toFixed(2),
      's,',
      audioBuffer.sampleRate,
      'Hz,',
      audioBuffer.numberOfChannels,
      'ch'
    )

    const wavBuffer = encodeWAV(audioBuffer)
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })

    log.info('Encoded WAV, size:', wavBlob.size, 'bytes')
    return wavBlob
  } finally {
    audioContext.close()
  }
}
