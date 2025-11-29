import camaraderie from "@images/mentorship/camaraderie.jpg";
import professional_growth from "@images/mentorship/professional_growth.jpg";
import service_responsibility from "@images/mentorship/service_responsibility.jpg";
import Image from "next/image";
import Link from "next/link";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";

const cards = [
  {
    title: "Leadership and Professional Growth",
    src: professional_growth,
    quote:
      "”Men and women make history and not the other way around. In periods where there is no leadership, society stands still. Progress occurs when courageous, skillful leaders seize the opportunity to change things for the better.” —Harry S. Truman",
  },
  {
    title: "Service and Community Responsibility",
    src: service_responsibility,
    quote:
      "“How wonderful it is that nobody need wait a single moment before starting to improve the world.” – Anne Frank",
  },
  {
    title: "Camaraderie and Mutual Support",
    src: camaraderie,
    quote:
      "“What is not good for the beehive cannot be good for the bee.” – Marcus Aurelius",
  },
];

export default function MentorshipLanding() {
  return (
    <TitleShell
      title={
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Mentorship
          </h1>
        </div>
      }
      scrollableContent={false}
      contentClassName="md:pr-0"
    >
      <section className="mx-auto flex w-full app-content-width flex-col gap-10 py-4 sm:py-6">
        <header className="text-center text-3xl font-semibold leading-tight text-primary sm:text-4xl">
          Begin <span className="italic font-bold text-accent">YOUR</span>{" "}
          Mentorship Journey
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 sm:flex-row">
          <Link href={"/mentorship/apply/mentor"} className="w-full sm:w-auto">
            <Button
              type="button"
              size="lg"
              className="
                inline-flex w-full items-center justify-center gap-3
                px-12 py-5 text-xl font-semibold sm:text-2xl
                bg-primary text-white
                transition-colors
                hover:bg-accent hover:text-white
                border-0
              "
            >
              <span>Apply to be a</span>
              <span className="font-bold">Mentor</span>
            </Button>
          </Link>

          <Link href={"/mentorship/apply/mentee"} className="w-full sm:w-auto">
            <Button
              type="button"
              size="lg"
              className="
                inline-flex w-full items-center justify-center gap-3
                px-12 py-5 text-xl font-semibold sm:text-2xl
                bg-primary text-white
                transition-colors
                hover:bg-accent hover:text-white
                border-0
              "
            >
              <span>Apply to be a</span>
              <span className="font-bold">Mentee</span>
            </Button>
          </Link>
        </div>

        <div className="mx-auto flex w-full app-content-width flex-col gap-12">
          {cards.map((card) => (
            <article
              key={card.title}
              className="
                grid grid-cols-1 gap-4
                md:grid-cols-[auto_minmax(0,1fr)]
                md:gap-10
                md:items-start
                md:ml-6
              "
            >
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-3xl bg-muted shadow-lg shadow-black/10 sm:h-48 sm:w-48 md:mx-0 md:col-start-1 md:row-start-1 md:row-span-2">
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 192px, (min-width: 1024px) 176px, (min-width: 640px) 176px, 176px"
                />
              </div>

              <h3
                className="
                  text-center text-xl font-semibold text-secondary sm:text-4xl
                  md:text-left md:col-start-2 md:row-start-1
                  md:mt-3
                "
              >
                {card.title}
              </h3>

              <p
                className="
                  whitespace-pre-line
                  text-center text-lg leading-relaxed text-secondary/80
                  md:text-left md:col-start-2 md:row-start-2
                  md:-mt-18
                "
              >
                {card.quote}
              </p>
            </article>
          ))}
        </div>
      </section>
    </TitleShell>
  );
}
