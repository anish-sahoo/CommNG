import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const cards = [
  {
    title: "Leadership and Professional Growth",
    src: "/mentorship-images/professional_growth.jpg",
  },
  {
    title: "Service and Community Responsibility",
    src: "/mentorship-images/service_responsibility.jpg",
  },
  {
    title: "Camaraderie and Mutual Support",
    src: "/mentorship-images/camaraderie.jpg",
  },
];

export default function MentorshipLanding() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="text-center text-3xl font-semibold leading-tight text-primary sm:text-4xl">
          Begin <span className="italic font-bold text-accent">YOUR</span>{" "}
          Mentorship Journey
        </header>
      </div>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="relative aspect-[5/5] w-full max-w-[18rem] overflow-hidden rounded-3xl bg-muted shadow-lg shadow-black/10 sm:max-w-[20rem] md:aspect-square">
              <Image
                src={card.src}
                alt={card.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 220px, 80vw"
              />
            </div>
            <h3 className="text-lg font-semibold text-secondary sm:text-xl">
              {card.title}
            </h3>
          </article>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href={"/mentorship/apply/mentor"}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="inline-flex items-center gap-1"
          >
            <span>Apply to be a</span>
            <span className="font-semibold">Mentor</span>
          </Button>
        </Link>
        <Link href={"/mentorship/apply/mentee"}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="inline-flex items-center gap-1"
          >
            <span>Apply to be a</span>
            <span className="font-semibold">Mentee</span>
          </Button>
        </Link>
      </div>
    </section>
  );
}
