import { Layout } from '../../../components/Layout';
import { Footer } from '../../../components/Footer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Calendar, Users, MessageSquare, Loader2, Bot, Users2 } from 'lucide-react';
import CodeEditer from '../../assets/img/CodeEditer.png';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PracticePage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userStore = localStorage.getItem('user');
  const user = userStore ? JSON.parse(userStore) : null;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-20 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Practice mock interviews <br />
              <span className="text-primary">with peers and AI</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join thousands of tech candidates practicing interviews to land jobs.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className={`px-8 h-12 text-white transition-all ${isSearching ? 'bg-orange-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={() => setIsModalOpen(true)}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Finding partner...
                  </>
                ) : (
                  'Practice Mode'
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12"
                onClick={() => navigate('/solo-ai')}
              >
                Schedule with Mentor
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={CodeEditer}
              alt="Platform"
              className="rounded-xl shadow-2xl border bg-muted"
            />
          </div>
        </section>

        {/* INTERVIEW MODE SELECTION MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Select Practice Mode
              </DialogTitle>
              <DialogDescription className="text-center">
                Choose the best method to sharpen your interview skills.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Option 1: Solo AI */}
              <div
                onClick={() => navigate('/practice/solo-recording')}
                className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-200">
                  <Bot size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Solo Interview with AI Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Practice individually and receive instant feedback from AI.
                  </p>
                </div>
              </div>

              {/* Option 2: Peer Matching */}
              <div
                onClick={() => navigate('/practice/matching')}
                className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200">
                  <Users2 size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Peer Matching</h4>
                  <p className="text-sm text-muted-foreground">
                    Get matched directly with other candidates for a live session.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* HOW IT WORKS */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Schedule a time',
                desc: 'Join later today or pre-schedule an hour-long mock interview session that suits your availability.',
                icon: Calendar,
              },
              {
                title: 'Get matched',
                desc: 'Automatically match with peers preparing for the same interviews. Take turns role-playing.',
                icon: Users,
              },
              {
                title: 'Exchange feedback',
                desc: 'Trade detailed notes using realistic rubrics. Get honest, actionable feedback from peers and AI.',
                icon: MessageSquare,
              },
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
                {
                  name: 'Maritza',
                  role: 'Product Manager, Microsoft',
                  text: 'Everything I needed in one place...',
                },
                {
                  name: 'Filipe',
                  role: 'SWE, Google',
                  text: "Nothing beats mock coding interviews. I wasn't nervous...",
                },
                {
                  name: 'Yinka',
                  role: 'Data Scientist, Meta',
                  text: 'Truly benefited from the mock practice sessions...',
                },
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

        {/* FAQ */}
        <section className="py-20 px-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does it work?</AccordionTrigger>
              <AccordionContent>
                The matching system pairs you with peers based on your role, experience level, and
                target companies.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it free?</AccordionTrigger>
              <AccordionContent>
                We offer free daily peer mock interviews, while AI feedback and premium coaching
                require a subscription.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        <Footer />
      </div>
    </Layout>
  );
}
