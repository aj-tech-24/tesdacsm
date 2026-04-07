"use client"

import { memo } from "react"
import Image from "next/image"

/**
 * Maps common emoji characters to their Microsoft Fluent Emoji 3D image URLs.
 * Images are served from the official Microsoft open-source Fluent Emoji repo
 * via jsDelivr CDN (no API key required).
 *
 * Browse all available emojis at:
 * https://github.com/microsoft/fluentui-emoji/tree/main/assets
 */
const BASE = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets"

const fluentEmojiMap: Record<string, string> = {
    // Faces – rating scale
    "😠": `${BASE}/Angry%20face/3D/angry_face_3d.png`,
    "😟": `${BASE}/Worried%20face/3D/worried_face_3d.png`,
    "😐": `${BASE}/Neutral%20face/3D/neutral_face_3d.png`,
    "🙂": `${BASE}/Neutral%20face/3D/neutral_face_3d.png`,
    "😊": `${BASE}/Slightly%20smiling%20face/3D/slightly_smiling_face_3d.png`,
    "😍": `${BASE}/Smiling%20face%20with%20heart-eyes/3D/smiling_face_with_heart-eyes_3d.png`,

    // UI icons
    "📋": `${BASE}/Clipboard/3D/clipboard_3d.png`,
    "⭐": `${BASE}/Star/3D/star_3d.png`,
    "💬": `${BASE}/Speech%20balloon/3D/speech_balloon_3d.png`,
    "👤": `${BASE}/Bust%20in%20silhouette/3D/bust_in_silhouette_3d.png`,
    "🌟": `${BASE}/Glowing%20star/3D/glowing_star_3d.png`,
    "🔒": `${BASE}/Locked/3D/locked_3d.png`,
    "🙏": `${BASE}/Folded%20hands/Default/3D/folded_hands_3d_default.png`,
    "✨": `${BASE}/Sparkles/3D/sparkles_3d.png`,
    "📝": `${BASE}/Memo/3D/memo_3d.png`,
    "🎉": `${BASE}/Party%20popper/3D/party_popper_3d.png`,
    "💙": `${BASE}/Blue%20heart/3D/blue_heart_3d.png`,
    "➖": `${BASE}/Minus/3D/minus_3d.png`,
    "🖨️": `${BASE}/Printer/3D/printer_3d.png`,

    // Client Information
    "🪪": `${BASE}/Man%20raising%20hand/Default/3D/man_raising_hand_3d_default.png`,
    "🏢": `${BASE}/Office%20building/3D/office_building_3d.png`,
    "🎓": `${BASE}/Graduation%20cap/3D/graduation_cap_3d.png`,
    "🏅": `${BASE}/Sports%20medal/3D/sports_medal_3d.png`,
    "🗂️": `${BASE}/Card%20index%20dividers/3D/card_index_dividers_3d.png`,
    "➕": `${BASE}/Plus/3D/plus_3d.png`,
    "🏛️": `${BASE}/Classical%20building/3D/classical_building_3d.png`,

}

interface Emoji3DProps {
    /** The emoji character to render as a 3D image */
    emoji: string
    /** Size in pixels (renders as a square). Default: 32 */
    size?: number
    /** Optional extra className for the wrapper span */
    className?: string
    /** Alt text override. If omitted, defaults to the emoji character itself. */
    alt?: string
}

/**
 * Renders a 3D Fluent Emoji image in place of a flat Unicode emoji.
 * Falls back to rendering the raw emoji text if the mapping is not found.
 */
export const Emoji3D = memo(function Emoji3D({ emoji, size = 32, className = "", alt }: Emoji3DProps) {
    const src = fluentEmojiMap[emoji]

    if (!src) {
        // Graceful fallback to the plain emoji
        return <span className={className} style={{ fontSize: size * 0.8 }}>{emoji}</span>
    }

    return (
        <span
            className={`inline-flex items-center justify-center select-none ${className}`}
            style={{ width: size, height: size, flexShrink: 0 }}
        >
            <Image
                src={src}
                alt={alt ?? emoji}
                width={size}
                height={size}
                className="object-contain drop-shadow-md"
                unoptimized
            />
        </span>
    )
})
