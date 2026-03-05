'use client'

import { useState } from 'react'

export default function Home() {
  const [activityId, setActivityId] = useState('7365f7f6-f2ac-4335-8d58-ef6be8fd98ee')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = (design: string) => {
    if (!activityId) return

    setLoading(true)
    // Force a cache-bust so it always fetches the newest render while developing
    setPreviewUrl(`/api/og/${activityId}?design=${design}&t=${Date.now()}`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Left Sidebar (Controls) */}
      <div className="w-full md:w-1/3 p-8 border-r border-zinc-800 flex flex-col gap-8 bg-zinc-900/50">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">ProRefuel OG Engine</h1>
          <p className="text-zinc-400 text-sm">Standalone Satori Proof of Concept.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Activity UUID</label>
            <input
              type="text"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
              placeholder="e.g. 7365f7f6-f2ac-4..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleGenerate('primary')}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            >
              Render Layout 1 (Map)
            </button>
            <button
              onClick={() => handleGenerate('poster')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-md border border-zinc-700 transition-colors text-sm"
            >
              Render Layout 2 (Poster)
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
          <h3 className="text-blue-400 font-medium mb-1 text-sm">Testing Instructions</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Find any valid <code className="text-zinc-300 bg-zinc-800 px-1 rounded">activity_id</code> from your Supabase production database, paste it above, and hit Render.
          </p>
        </div>
      </div>

      {/* Right Side (Preview Area) */}
      <div className="w-full md:w-2/3 p-8 flex flex-col items-center justify-center bg-zinc-950">
        <div className="w-full max-w-[400px] aspect-[1080/1920] border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-900 relative shadow-2xl flex items-center justify-center">
          {!previewUrl && !loading && (
            <p className="text-zinc-500">Awaiting Render...</p>
          )}

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-900/80 backdrop-blur-sm">
              <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-orange-500 font-medium animate-pulse">Generating ProRefuel Card...</p>
            </div>
          )}

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Generated Output"
              className="w-full h-full object-cover"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}
        </div>

        {previewUrl && !loading && (
          <button
            onClick={async () => {
              try {
                const response = await fetch(previewUrl)
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `prorefuel-activity-${activityId}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
              } catch (error) {
                console.error("Download failed:", error)
              }
            }}
            className="mt-8 bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Story Graphic
          </button>
        )}
      </div>
    </main>
  )
}
