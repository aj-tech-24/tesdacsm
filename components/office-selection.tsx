import { Card, CardContent } from "@/components/ui/card"
import { Emoji3D } from "@/components/emoji-3d"
import { ChevronRight } from "lucide-react"

const offices = [
    {
        id: "po-ds",
        title: "Provincial District Office",
        subtitle: "(TESDA PO DS)",
        emoji: "🏛️",
        color: "from-blue-400 to-blue-600",
        shadow: "shadow-blue-500/30",
    },
    {
        id: "ccnts",
        title: "Administered School",
        subtitle: "(CCNTS)",
        emoji: "🎓",
        color: "from-indigo-400 to-indigo-600",
        shadow: "shadow-indigo-500/30",
    },
    {
        id: "ptc-ds",
        title: "Training Centers",
        subtitle: "(PTC - DS)",
        emoji: "🏢",
        color: "from-sky-400 to-sky-600",
        shadow: "shadow-sky-500/30",
    },
]

export function OfficeSelection({ onSelect }: { onSelect: (office: string) => void }) {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-50">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-300/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-indigo-300/30 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-5xl w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-6 md:mb-8">
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-full shadow-sm border border-white mb-4 transition-transform hover:scale-105 duration-500">
                        <img
                            src="/tesda-logo.png"
                            alt="TESDA Logo"
                            className="h-16 md:h-20 object-contain drop-shadow-md"
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-blue-700 font-bold text-xs md:text-sm mb-3 md:mb-4 border border-blue-100 uppercase tracking-widest">
                        <Emoji3D emoji="✨" size={14} />
                        Welcome to TESDA
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-2 md:mb-3 text-center tracking-tight drop-shadow-sm">
                        Client Satisfaction
                    </h1>
                    <p className="text-slate-500 text-center max-w-2xl text-base md:text-lg font-medium leading-relaxed">
                        Please select the office or institution you recently transacted with to begin your feedback.
                    </p>
                </div>

                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
                    {offices.map((office, index) => {
                        return (
                            <Card
                                key={office.id}
                                className="group cursor-pointer border-2 border-white bg-white/60 backdrop-blur-xl hover:bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden rounded-3xl"
                                onClick={() => onSelect(`${office.title} ${office.subtitle}`)}
                                style={{ animationFillMode: 'both', animationDelay: `${index * 150}ms` }}
                            >
                                {/* Hover Gradient border effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${office.color} transition-opacity duration-500`} />

                                <CardContent className="p-5 flex flex-col h-full items-center text-center relative z-10">
                                    {/* Icon Container */}
                                    <div className={`w-20 h-20 mb-4 rounded-3xl bg-gradient-to-br ${office.color} ${office.shadow} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out relative`}>
                                        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-sm opacity-50" />
                                        <div className="relative z-10 drop-shadow-2xl group-hover:-mt-1 group-hover:scale-110 transition-all duration-500">
                                            <Emoji3D emoji={office.emoji} size={48} />
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-blue-700 transition-colors">
                                        {office.title}
                                    </h3>
                                    <p className="text-xs md:text-sm font-semibold text-slate-500 mb-5">
                                        {office.subtitle}
                                    </p>

                                    {/* Action Button Indicator */}
                                    <div className="mt-auto pt-2 w-full flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-500 border border-transparent">
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
