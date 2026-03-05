import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const url = new URL(request.url)
    const design = url.searchParams.get('design') || 'primary'

    try {
        // --- Extract State from URL Query Parameters ---
        // This makes the microservice a deterministic "dumb renderer"
        const title = url.searchParams.get('title') || 'Mission Accomplished'

        // Poster Metrics
        const energyKcal = url.searchParams.get('energy') || "850"
        const estimatedCarbBurnGrams = url.searchParams.get('glycogen') || "120"
        const carbsToRefuel = url.searchParams.get('carbs') || "72"
        const proteinToRepair = url.searchParams.get('protein') || "35"
        const velocityTarget = url.searchParams.get('velocity') || "< 45'"

        // Primary Map Metrics
        const distanceVal = url.searchParams.get('distance') || "10.0"
        const timeFormatted = url.searchParams.get('timeFormatted') || "1h 30m"
        const elevation = url.searchParams.get('elevation') || "500"
        const avgSpeedStr = url.searchParams.get('avgSpeed') || "25"
        const maxSpeedStr = url.searchParams.get('maxSpeed') || "45"
        const avgHrStr = url.searchParams.get('avgHr') || "145"
        const maxHrStr = url.searchParams.get('maxHr') || "185"

        const avgSpeed = parseFloat(avgSpeedStr)
        const maxSpeed = parseFloat(maxSpeedStr)
        const avgHr = parseFloat(avgHrStr)
        const maxHr = parseFloat(maxHrStr)
        const intensityScore = parseInt(url.searchParams.get('intensityScore') || "75")
        const loadScore = parseInt(url.searchParams.get('loadScore') || "80")

        // Polyline for Mapbox (Optional)
        const polyline = url.searchParams.get('polyline')
        let mapBackgroundElement = null
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        if (mapboxToken && polyline) {
            const encoded = encodeURIComponent(polyline)
            // Mapbox API max dimension is 1280px. We request a 1080x1200 map overlaid on the 1080x1920 canvas.
            const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/path-5+f97316(${encoded})/auto/1080x1200@2x?padding=100&access_token=${mapboxToken}`

            try {
                const mapRes = await fetch(mapUrl)
                if (mapRes.ok) {
                    const arrayBuffer = await mapRes.arrayBuffer()

                    let binary = ''
                    const bytes = new Uint8Array(arrayBuffer)
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i])
                    }
                    const base64 = btoa(binary)

                    mapBackgroundElement = (
                        <img
                            src={`data:image/png;base64,${base64}`}
                            style={{ position: 'absolute', top: 0, left: 0, width: '1080px', height: '1920px', objectFit: 'cover' }}
                        />
                    )
                } else {
                    console.error("Mapbox error:", await mapRes.text())
                }
            } catch (err) {
                console.error("Mapbox fetch failed silently:", err)
            }
        }

        // 4. Fetch the rendered logo.png from the same origin to inject as a base64 image
        let logoBase64 = null
        try {
            const origin = url.origin
            const logoRes = await fetch(`${origin}/logo.png`)
            if (logoRes.ok) {
                const arrayBuffer = await logoRes.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                logoBase64 = buffer.toString('base64')
            } else {
                console.error("Failed to fetch logo.png:", logoRes.status)
            }
        } catch (err) {
            console.error("Error fetching logo.png silently:", err)
        }

        // 5. SVG Gauge Helpers (3 colored zones)
        const createDualGauge = (avg: number, max: number, maxAxis: number, label: string, unit: string) => {
            const cx = 160
            const cy = 160
            const r = 120

            const angleAvg = Math.PI - (Math.min(avg / maxAxis, 1) * Math.PI)
            const xAvg = cx + Math.cos(angleAvg) * (r - 20)
            const yAvg = cy - Math.sin(angleAvg) * (r - 20)

            const angleMax = Math.PI - (Math.min(max / maxAxis, 1) * Math.PI)
            const xMax = cx + Math.cos(angleMax) * r
            const yMax = cy - Math.sin(angleMax) * r

            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '32px 24px', borderRadius: '32px', flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', width: '320px', height: '180px' }}>
                        <svg width="320" height="180" viewBox="0 0 320 180" style={{ display: 'block' }}>
                            <path d="M 40 160 A 120 120 0 0 1 100 56" fill="none" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="20" strokeLinecap="butt" />
                            <path d="M 100 56 A 120 120 0 0 1 220 56" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="20" strokeLinecap="butt" />
                            <path d="M 220 56 A 120 120 0 0 1 280 160" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="20" strokeLinecap="butt" />

                            <line x1="160" y1="160" x2={String(xMax)} y2={String(yMax)} stroke="rgba(255,255,255,0.7)" strokeWidth="6" strokeLinecap="round" strokeDasharray="6 6" />
                            <line x1="160" y1="160" x2={String(xAvg)} y2={String(yAvg)} stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />

                            <circle cx="160" cy="160" r="16" fill="#111" stroke="#ffffff" strokeWidth="6" />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: 32, textTransform: 'uppercase', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', gap: '8px' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>AVG - <span style={{ color: '#ffffff', fontWeight: 800 }}>{avg} {unit}</span></span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>|</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>MAX - <span style={{ color: '#ffffff', fontWeight: 800 }}>{max} {unit}</span></span>
                        </div>
                    </div>
                </div>
            )
        }

        const createSingleGauge = (value: number, maxAxis: number, label: string, unit: string) => {
            const cx = 160
            const cy = 160
            const r = 120

            // 180 degree math. 0 is Right, PI is Left.
            const angleVal = Math.PI - (Math.min(value / maxAxis, 1) * Math.PI)
            const xVal = cx + Math.cos(angleVal) * (r - 20)
            const yVal = cy - Math.sin(angleVal) * (r - 20)

            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '32px 24px', borderRadius: '32px', flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', width: '320px', height: '180px' }}>
                        <svg width="320" height="180" viewBox="0 0 320 180" style={{ display: 'block' }}>
                            <path d="M 40 160 A 120 120 0 0 1 100 56" fill="none" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="20" strokeLinecap="butt" />
                            <path d="M 100 56 A 120 120 0 0 1 220 56" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="20" strokeLinecap="butt" />
                            <path d="M 220 56 A 120 120 0 0 1 280 160" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="20" strokeLinecap="butt" />

                            <line x1="160" y1="160" x2={String(xVal)} y2={String(yVal)} stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
                            <circle cx="160" cy="160" r="16" fill="#111" stroke="#ffffff" strokeWidth="6" />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: 32, textTransform: 'uppercase', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' }}>{label}</span>
                        {unit && <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{unit}</span>}
                    </div>
                </div>
            )
        }

        // ==========================================
        // Alternate Design Branch: Poster Layout
        // ==========================================
        if (design === 'poster') {
            return new ImageResponse(
                (
                    <div
                        style={{
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #5E3807 0%, #3a2204 100%)', // Custom Dark Brown gradient
                            color: 'white',
                            fontFamily: 'sans-serif',
                            padding: '60px 80px',
                            position: 'relative'
                        }}
                    >
                        {/* Mapbox subtle background just for texture if available */}
                        {mapBackgroundElement && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, display: 'flex', mixBlendMode: 'overlay' }}>
                                {mapBackgroundElement}
                            </div>
                        )}

                        {/* TOP SECTION: Logo and Title */}
                        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, width: '100%' }}>
                            {/* Logo Row */}
                            {logoBase64 && (
                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '60px' }}>
                                    <img src={`data:image/png;base64,${logoBase64}`} width="350" height="84" alt="ProRefuel" />
                                </div>
                            )}

                            {/* Header Activity Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>Mission Accomplished</span>
                                <h1 style={{ fontSize: 80, fontWeight: 800, margin: 0, lineHeight: 1.1, textTransform: 'uppercase', textAlign: 'center', textShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                                    {title}
                                </h1>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: 3 Data Boxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, width: '100%', gap: '32px' }}>

                            {/* BOX 1: Distance / Duration / Elevation */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)', padding: '50px', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>Distance</span>
                                    <span style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1 }}>{distanceVal}<span style={{ fontSize: 24, fontWeight: 700, marginLeft: '6px' }}>KM</span></span>
                                </div>
                                <div style={{ width: '2px', backgroundColor: 'rgba(255,255,255,0.2)', height: '100px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>Time</span>
                                    <span style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1 }}>{timeFormatted}</span>
                                </div>
                                <div style={{ width: '2px', backgroundColor: 'rgba(255,255,255,0.2)', height: '100px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>Gain</span>
                                    <span style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1 }}>{elevation}<span style={{ fontSize: 24, fontWeight: 700, marginLeft: '6px' }}>M</span></span>
                                </div>
                            </div>

                            {/* BOX 2: Metabolic Expenditure */}
                            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.12)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)', padding: '50px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f97316', borderRadius: '12px', padding: '8px' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
                                    </div>
                                    <h2 style={{ fontSize: 36, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '1px' }}>Metabolic Expenditure</h2>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', gap: '80px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px' }}>Total Energy</span>
                                        <span style={{ fontSize: 64, fontWeight: 900, color: 'white', lineHeight: 1 }}>{energyKcal}<span style={{ fontSize: 22, color: 'white', marginLeft: '6px', fontWeight: 800 }}>KCAL</span></span>
                                    </div>
                                    <div style={{ width: '2px', backgroundColor: 'rgba(255,255,255,0.2)', height: '80px' }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px' }}>Glycogen Depleted</span>
                                        <span style={{ fontSize: 64, fontWeight: 900, color: 'white', lineHeight: 1 }}>{estimatedCarbBurnGrams}<span style={{ fontSize: 22, color: 'white', marginLeft: '6px', fontWeight: 800 }}>g</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* BOX 3: Performance Optimization */}
                            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.12)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)', padding: '50px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', borderRadius: '12px', padding: '8px' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                    </div>
                                    <h2 style={{ fontSize: 36, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '1px' }}>Performance Optimization</h2>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                        <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Refuel (Carbs)</span>
                                        <span style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{carbsToRefuel}<span style={{ fontSize: 20, color: 'white', marginLeft: '4px', fontWeight: 800 }}>g</span></span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '24px' }}>
                                        <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Repair (Protein)</span>
                                        <span style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{proteinToRepair}<span style={{ fontSize: 20, color: 'white', marginLeft: '4px', fontWeight: 800 }}>g</span></span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.2, borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Ideal Anabolic Window</span>
                                        </div>
                                        <span style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1 }}>{velocityTarget}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer minimal tag */}
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '30px', zIndex: 10 }}>
                            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '4px' }}>GENERATED BY PROREFUEL.APP</span>
                        </div >
                    </div >
                ),
                {
                    width: 1080,
                    height: 1920,
                }
            )
        }

        // Primary Map Design Branch
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                        padding: '140px 60px 80px 60px',
                        fontFamily: 'sans-serif',
                        position: 'relative',
                    }}
                >
                    {/* Mapbox Background Injector */}
                    {mapBackgroundElement}

                    {/* Top Overlay (Header details + Distance/Time/Elevation) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', zIndex: 10 }}>
                        {/* 1. Activity Title */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '20px', marginBottom: '40px' }}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            <h1 style={{ fontSize: 72, fontWeight: 600, margin: 0, lineHeight: 1.05, textTransform: 'uppercase', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                                {title}
                            </h1>
                        </div>

                        {/* 2. Core Metrics with bottom border */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '32px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Distance</span>
                                <span style={{ fontSize: 80, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{distanceVal}<span style={{ fontSize: 36, color: '#f97316', marginLeft: '8px' }}>KM</span></span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Time</span>
                                <span style={{ fontSize: 80, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{timeFormatted}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg> Gain
                                </span>
                                <span style={{ fontSize: 80, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{elevation}<span style={{ fontSize: 36, color: '#3b82f6', marginLeft: '8px' }}>M</span></span>
                            </div>
                        </div>

                        {/* 3. Logo beneath the line */}
                        {logoBase64 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`data:image/png;base64,${logoBase64}`} width="250" height="60" alt="ProRefuel" />
                            </div>
                        )}
                    </div>

                    {/* Bottom Stats Overlay Gauges */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            background: 'rgba(10, 10, 10, 0.85)',
                            border: '2px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '48px',
                            padding: '40px',
                            gap: '32px',
                            zIndex: 10
                        }}
                    >
                        <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
                            {createSingleGauge(
                                intensityScore,
                                100,
                                'Intensity',
                                ''
                            )}
                            {createSingleGauge(
                                loadScore,
                                100,
                                'Workload',
                                ''
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
                            {createDualGauge(
                                Math.round(avgHr),
                                Math.round(maxHr),
                                200,
                                'Heart Rate',
                                ''
                            )}
                            {createDualGauge(
                                avgSpeed,
                                maxSpeed,
                                60,
                                'Speed',
                                'KM/H'
                            )}
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1080,
                height: 1920,
            }
        )
    } catch (e: any) {
        return new Response(`Failed to generate image: ${e.message}`, { status: 500 })
    }
}
