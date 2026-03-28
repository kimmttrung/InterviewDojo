import { Layout } from "../../../components/Layout";
import { Footer } from "../../../components/Footer";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../components/ui/accordion";
import { CheckCircle2, Calendar, Users, MessageSquare } from "lucide-react";
import CodeEditer from "../../assets/img/CodeEditer.png";

export default function Practice() {
    return (
        <Layout>
            <div className="min-h-screen bg-background">

                {/* HERO SECTION - Matching the image */}
                <section className="py-20 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                            Practice mock interviews <br />
                            <span className="text-primary">with peers and AI</span>
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Join thousands of tech candidates practicing interviews to land jobs.
                            Practice real questions over video chat in a collaborative environment with helpful AI feedback.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12">
                                Schedule peer mock interview
                            </Button>
                            <Button size="lg" variant="outline" className="px-8 h-12">
                                Start an AI interview
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <img
                            src={CodeEditer}// Hãy thay bằng ảnh screenshot bạn upload
                            alt="Platform Preview"
                            className="rounded-xl shadow-2xl border bg-muted"
                        />
                    </div>
                </section>

                {/* HOW EVERYONE PREPARES */}
                <section className="py-16 bg-muted/30 px-8">
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Who's using it</span>
                        <h2 className="text-3xl font-bold">How everyone in tech prepares</h2>
                        <p className="text-muted-foreground text-lg">
                            Exponent Practice supports interview prep for everyone in tech. From product management to software engineering and data roles, there are thousands of practice questions to choose from.
                        </p>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="py-20 px-8 max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl font-bold mb-16">How it works</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Schedule a time",
                                desc: "Join later today or pre-schedule an hour-long mock interview session that suits your availability.",
                                icon: Calendar
                            },
                            {
                                title: "Get matched",
                                desc: "Automatically match with peers preparing for the same interviews. Take turns role-playing.",
                                icon: Users
                            },
                            {
                                title: "Exchange feedback",
                                desc: "Trade detailed notes using realistic rubrics. Get honest, actionable feedback from peers and AI.",
                                icon: MessageSquare
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold">{step.title}</h3>
                                <p className="text-muted-foreground">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="py-20 bg-indigo-600 text-white px-8 text-center">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-3xl font-bold">Join thousands of candidates landing dream jobs</h2>
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            {[
                                { name: "Maritza", role: "Product Manager, Microsoft", text: "Everything I needed in one place..." },
                                { name: "Filipe", role: "SWE, Google", text: "Nothing beats mock coding interviews. I wasn't nervous..." },
                                { name: "Yinka", role: "Data Scientist, Meta", text: "Truly benefited from the mock practice sessions..." }
                            ].map((t, i) => (
                                <Card key={i} className="p-6 bg-white/10 border-white/20 text-white">
                                    <p className="italic mb-4 text-sm">"{t.text}"</p>
                                    <p className="font-bold">{t.name}</p>
                                    <p className="text-xs text-indigo-200">{t.role}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ SECTION */}
                <section className="py-20 px-8 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Frequently asked questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>How does it work?</AccordionTrigger>
                            <AccordionContent>
                                The matching system pairs you with peers based on your role, experience level, and target companies.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is it free?</AccordionTrigger>
                            <AccordionContent>
                                We offer free daily peer mock interviews, while AI feedback and premium coaching require a subscription.
                            </AccordionContent>
                        </AccordionItem>
                        {/* Add more FAQ items here */}
                    </Accordion>
                </section>

                <Footer />
            </div>
        </Layout>
    );
}