'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Star } from 'lucide-react'

export interface UploadedImage {
  file: File
  preview: string
  isCover: boolean
}

interface Props {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
}

export default function ImageUploader({ images, onChange, maxImages = 20 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newImages: UploadedImage[] = []
    Array.from(files).slice(0, maxImages - images.length).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        isCover: images.length === 0 && newImages.length === 0,
      })
    })
    onChange([...images, ...newImages])
  }

  const remove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx)
    if (images[idx].isCover && next.length > 0) {
      next[0] = { ...next[0], isCover: true }
    }
    onChange(next)
  }

  const setCover = (idx: number) => {
    onChange(images.map((img, i) => ({ ...img, isCover: i === idx })))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          사진 업로드
        </p>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {images.length}/{maxImages}장
        </span>
      </div>

      <div
        className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-gray-50"
        style={{ borderColor: 'var(--color-border)' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-accent-light)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          클릭하거나 드래그해서 사진 업로드
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          JPG, PNG, WEBP · 최대 {maxImages}장
        </p>
        <p className="mt-2 text-xs p-2 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}>
          ⚠ 얼굴, 주소, 개인정보가 포함된 사진은 업로드하지 마세요
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border"
              style={{ borderColor: img.isCover ? 'var(--color-accent)' : 'var(--color-border)' }}>
              <Image src={img.preview} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

              {/* 대표 사진 표시 */}
              {img.isCover && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ background: 'var(--color-accent)' }}>
                  대표
                </div>
              )}

              {/* 버튼들 */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => setCover(idx)}
                    className="p-1 rounded-full bg-white/90 hover:bg-white"
                    title="대표 사진으로 설정"
                  >
                    <Star size={12} style={{ color: 'var(--color-accent)' }} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1 rounded-full bg-white/90 hover:bg-white"
                >
                  <X size={12} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
