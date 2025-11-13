import Image from "next/image";
import Link from "next/link";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";
import camaraderie from "../../../public/images/mentorship/camaraderie.jpg";
import professional_growth from "../../../public/images/mentorship/professional_growth.jpg";
import service_responsibility from "../../../public/images/mentorship/service_responsibility.jpg";

const cards = [
  {
    title: "Leadership and Professional Growth",
    src: professional_growth,
  },
  {
    title: "Service and Community Responsibility",
    src: service_responsibility,
  },
  {
    title: "Camaraderie and Mutual Support",
    src: camaraderie,
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

        <div className="mx-auto grid w-full app-content-width grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="relative aspect-[5/5] w-full max-w-[16rem] overflow-hidden rounded-3xl bg-muted shadow-lg shadow-black/10 sm:max-w-[18rem] md:aspect-square lg:max-w-[22rem] xl:max-w-[26rem] 2xl:max-w-[30rem]">
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
    </TitleShell>
  );
}
