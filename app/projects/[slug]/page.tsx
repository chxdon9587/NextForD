import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RewardCard } from "@/components/project/reward-card";
import { MilestoneProgress } from "@/components/milestone/milestone-progress";
import { CommentThread } from "@/components/comments/comment-thread";
import { UpdateCard } from "@/components/updates/update-card";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      users!projects_creator_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      ),
      milestones (*),
      rewards (*)
    `)
    .eq("slug", slug)
    .single();

  const mockProject = {
    id: "1",
    slug: "3d-printed-miniatures",
    title: "Ultra-Detailed 3D Printed Miniatures Collection",
    description: `We're creating the most detailed 3D printed miniatures for tabletop gaming enthusiasts. Each miniature is crafted with precision at 28mm scale.

## What We're Building

Our collection includes:
- Fantasy Heroes (10 unique characters)
- Monster Pack (15 creatures)
- Terrain Set (modular dungeon pieces)
- Custom Base Collection

## Why Support Us?

- Industry-leading detail and quality
- Fully customizable designs
- DRM-free STL files for backers
- Regular updates with new designs

## The Team

We're a team of passionate 3D artists and tabletop gamers with 5+ years of experience in miniature design.`,
    image_url: null,
    category: "miniatures",
    status: "live",
    funding_type: "milestone",
    funding_goal: 10000,
    current_funding: 7500,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    creator_id: "1",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    users: {
      id: "1",
      username: "MiniMaster3D",
      full_name: "Alex Chen",
      avatar_url: null,
    },
    milestones: [
      {
        id: "m1",
        title: "Design & Prototyping",
        description: "Complete all character designs and create test prints",
        funding_target: 3000,
        order: 1,
        status: "verified",
      },
      {
        id: "m2",
        title: "Hero Collection",
        description: "Finalize and deliver 10 hero miniatures",
        funding_target: 6000,
        order: 2,
        status: "in_progress",
      },
      {
        id: "m3",
        title: "Monster Pack",
        description: "Complete monster collection with 15 unique creatures",
        funding_target: 10000,
        order: 3,
        status: "pending",
      },
    ],
    rewards: [
      {
        id: "r1",
        title: "Digital Supporter",
        description: "- Digital thank you card\n- Project updates\n- Early access to designs",
        pledge_amount: 10,
        estimated_delivery: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        backer_limit: null,
        shipping_type: "digital",
      },
      {
        id: "r2",
        title: "Hero Pack",
        description: "- All Digital Supporter rewards\n- 5 hero miniatures (your choice)\n- STL files for personal printing",
        pledge_amount: 50,
        estimated_delivery: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        backer_limit: 100,
        shipping_type: "worldwide",
      },
      {
        id: "r3",
        title: "Complete Collection",
        description: "- All previous rewards\n- Full 10-hero collection\n- Monster pack (15 miniatures)\n- Exclusive backer-only design\n- Premium packaging",
        pledge_amount: 150,
        estimated_delivery: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        backer_limit: 50,
        shipping_type: "worldwide",
      },
    ],
  };

  const displayProject = project || mockProject;

  const backersCount = 85;
  const daysLeft = Math.ceil(
    (new Date(displayProject.deadline).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
  const fundingPercentage =
    (displayProject.current_funding / displayProject.funding_goal) * 100;

  const milestonesWithFunding = displayProject.milestones.map((m: any) => ({
    ...m,
    currentFunding: m.status === "verified" ? m.funding_target : m.status === "in_progress" ? displayProject.current_funding : 0,
  }));

  const mockComments = [
    {
      id: "c1",
      content: "This looks amazing! Can't wait to print these miniatures. The detail level is incredible!",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      author: {
        id: "u1",
        name: "Sarah K.",
        avatar: undefined,
      },
      replies: [
        {
          id: "c1-r1",
          content: "Thanks for the support! We're working hard to make them perfect.",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          author: {
            id: displayProject.users.id,
            name: displayProject.users.full_name || displayProject.users.username,
            avatar: displayProject.users.avatar_url,
          },
        },
      ],
    },
  ];

  const mockUpdates = [
    {
      id: "u1",
      title: "First Prototypes Are Here! 🎉",
      content: `Exciting news everyone! We've received our first batch of test prints and they look AMAZING.

The detail captured at 28mm scale exceeded our expectations. We've made a few minor adjustments to the hero poses based on early feedback, and the results are perfect.

Photos coming soon in the next update!`,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      visibility: "public" as const,
      author: {
        name: displayProject.users.full_name || displayProject.users.username,
        avatar: displayProject.users.avatar_url,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/projects" className="hover:text-primary-600">
              Projects
            </Link>
            <span>/</span>
            <span className="capitalize">{displayProject.category}</span>
            <span>/</span>
            <span className="text-foreground">{displayProject.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {displayProject.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    by{" "}
                    <span className="text-primary-600 font-semibold">
                      {displayProject.users.full_name || displayProject.users.username}
                    </span>
                  </p>
                </div>
                <Badge variant="success" className="capitalize">
                  {displayProject.status}
                </Badge>
              </div>

              <div className="prose max-w-none">
                {displayProject.description.split("\n").map((paragraph: string, i: number) => (
                  <p key={i} className="mb-4 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div id="milestones">
              <h2 className="text-2xl font-bold mb-6">Funding Milestones</h2>
              <MilestoneProgress
                milestones={milestonesWithFunding}
                totalFunding={displayProject.current_funding}
                totalGoal={displayProject.funding_goal}
              />
            </div>

            <div id="rewards">
              <h2 className="text-2xl font-bold mb-6">Rewards</h2>
              <div className="grid gap-6">
                {displayProject.rewards.map((reward: any) => (
                  <RewardCard
                    key={reward.id}
                    id={reward.id}
                    title={reward.title}
                    description={reward.description}
                    pledgeAmount={reward.pledge_amount}
                    estimatedDelivery={new Date(reward.estimated_delivery)}
                    backerLimit={reward.backer_limit}
                    backersCount={Math.floor(Math.random() * 30)}
                    shippingType={reward.shipping_type}
                  />
                ))}
              </div>
            </div>

            <div id="updates">
              <h2 className="text-2xl font-bold mb-6">Updates</h2>
              <div className="space-y-6">
                {mockUpdates.map((update) => (
                  <UpdateCard key={update.id} {...update} />
                ))}
              </div>
            </div>

            <div id="comments">
              <h2 className="text-2xl font-bold mb-6">Discussion</h2>
              <CommentThread comments={mockComments} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-primary-600 mb-1">
                      ${displayProject.current_funding}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      pledged of ${displayProject.funding_goal} goal
                    </p>
                  </div>

                  <Progress
                    value={displayProject.current_funding}
                    max={displayProject.funding_goal}
                    className="h-2"
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-2xl font-bold">{backersCount}</div>
                      <p className="text-sm text-muted-foreground">backers</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{daysLeft}</div>
                      <p className="text-sm text-muted-foreground">days to go</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Button className="w-full" size="lg">
                      Back This Project
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Save Project
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground pt-4 border-t">
                    Milestone-based funding • Funds released as goals are met
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About the Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                      {displayProject.users.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {displayProject.users.full_name || displayProject.users.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{displayProject.users.username}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
