import { Layout } from "../../../components/Layout";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

import {
    Share2,
    Code2,
    Brain,
    Users,
    BookOpen,
    MessageCircle,
    Target,
} from "lucide-react";

export default function Home() {
    const features = [
        { title: "Share interview experience", icon: Share2, color: "from-pink-500 to-rose-500" },
        { title: "Learn to ace SWE interviews", icon: BookOpen, color: "from-indigo-500 to-purple-500" },
        { title: "Practice coding questions", icon: Code2, color: "from-blue-500 to-cyan-500" },
        { title: "Senior+ behavioral prep", icon: Users, color: "from-green-500 to-emerald-500" },
        { title: "Prep for AI companies", icon: Brain, color: "from-purple-500 to-violet-500" },
        { title: "View interview questions", icon: MessageCircle, color: "from-orange-500 to-amber-500" },
        { title: "Practice with an AI interviewer", icon: Target, color: "from-red-500 to-pink-500" },
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 bg-gradient-to-b from-background to-muted/20 min-h-screen">
                {/* HEADER */}

                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, Mai!
                    </h1>

                    <p className="text-muted-foreground">
                        Continue learning with our recommendations based on your career goals and recent activity.
                    </p>
                </div>

                {/* FEATURE GRID */}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {features.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={index}
                                className="p-4 flex flex-col items-center text-center transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 border hover:border-primary/40"
                            >
                                <div
                                    className={`p-3 rounded-lg mb-2 text-white bg-gradient-to-r ${item.color} shadow`}
                                >
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>

                                <p className="text-sm font-medium">
                                    {item.title}
                                </p>
                            </Card>
                        );
                    })}
                </div>

                {/* MAIN GRID */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT SIDE */}

                    <div className="space-y-6">

                        {/* Getting started */}

                        <Card className="p-6">
                            <h2 className="font-semibold text-lg mb-2">
                                Getting started
                            </h2>

                            <p className="text-sm text-muted-foreground mb-4">
                                Start preparing for your next interview.
                            </p>

                            <ul className="space-y-2 text-sm">
                                <li>Sign up for Exponent</li>
                                <li>Start your first course</li>
                                <li>Explore interview questions</li>
                                <li>Join a practice interview</li>
                                <li>Book a coaching session</li>
                            </ul>
                        </Card>

                        {/* Question of the day */}

                        <Card className="p-6 space-y-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                Question of the day
                            </Badge>
                            <h3 className="font-medium">
                                Design a taxi recommendation system for airports.
                            </h3>

                            <div className="flex gap-2">
                                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 transition">
                                    Answer now
                                </Button>
                                <Button variant="outline">Shuffle</Button>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Answer a practice question to stay on top of your interview preparation.
                            </p>
                        </Card>

                        {/* Career goals */}

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">
                                My career goals
                            </h3>

                            <p className="text-sm text-muted-foreground mb-4">
                                I'm applying for Software Engineer roles at Meta-facebook and 3 more.
                            </p>

                            <Button variant="outline">
                                Edit goals
                            </Button>
                        </Card>

                        {/* Refer friends */}

                        <Card className="p-6 space-y-3">
                            <h3 className="font-semibold">
                                Refer your friends 🎁
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Share your 10% discount with four friends and get free lifetime access to Exponent!
                            </p>

                            <div className="text-sm bg-muted p-2 rounded">
                                https://www.tryexponent.com/refer/wyazba
                            </div>

                            <Button variant="outline">
                                More details
                            </Button>
                        </Card>
                    </div>

                    {/* RIGHT SIDE */}

                    <div className="lg:col-span-2 space-y-6">

                        {/* Courses */}

                        <Card className="p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Start a new course
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Here are our recommended courses based on your career goals.
                                </p>
                            </div>

                            {/* Course item */}

                            <div className="flex items-center justify-between">
                                <div>
                                    <Badge className="mb-2 bg-emerald-500 text-white">
                                        Recommended
                                    </Badge>

                                    <h3 className="font-medium">
                                        Software Engineering Interview Prep
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        4 courses
                                    </p>
                                </div>

                                <Button>Start course</Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Badge className="mb-2">Recommended</Badge>

                                    <h3 className="font-medium">
                                        Amazon Software Development Engineer (SDE) Interview Course
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        5 courses
                                    </p>
                                </div>

                                <Button>Start course</Button>
                            </div>

                            <Button
                                variant="link"
                                className="text-indigo-500 hover:text-indigo-600 transition"
                            >
                                See more courses
                            </Button>
                        </Card>

                        {/* Interview Questions */}

                        <Card className="p-6 space-y-4">

                            <h2 className="text-lg font-semibold">
                                Interview questions
                            </h2>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">
                                        Amazon Software Engineer Questions
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        Check out example Amazon Software Engineer Questions
                                    </p>
                                </div>

                                <Button variant="outline">
                                    View Now
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">
                                        Google Software Engineer Questions
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        Check out example Google Software Engineer Questions
                                    </p>
                                </div>

                                <Button variant="outline">
                                    View Now
                                </Button>
                            </div>

                            <Button variant="link">
                                See more questions
                            </Button>
                        </Card>

                        {/* Practice interviews */}

                        <Card className="p-6 space-y-4">

                            <h2 className="text-lg font-semibold">
                                Practice interviews
                            </h2>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">
                                        Thang T.
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        Senior Data Engineer | Amazon (ex-Meta, Apple)
                                    </p>
                                </div>

                                <Button>
                                    Book Now
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">
                                        Venkata K.
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        Software Engineer | Amazon
                                    </p>
                                </div>

                                <Button>
                                    Book Now
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">
                                        Peer mock interviews
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        Practice with peers every day on our live mock interview platform.
                                    </p>
                                </div>

                                <Button>
                                    Join Now
                                </Button>
                            </div>

                        </Card>

                    </div>
                </div>
            </div>
        </Layout>
    );
}