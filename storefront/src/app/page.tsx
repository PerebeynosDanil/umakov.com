import { Hero } from "@/components/home/hero";
import { Categories } from "@/components/home/categories";
import { InstallOptions } from "@/components/home/install-options";
import { Steps } from "@/components/home/steps";
import { Promos } from "@/components/home/promos";
import { Projects } from "@/components/home/projects";
import { Cta } from "@/components/home/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <InstallOptions />
      <Steps />
      <Promos />
      <Projects />
      <Cta />
    </>
  );
}
