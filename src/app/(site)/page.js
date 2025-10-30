import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner principal */}
      <div className="relative h-[75vh] w-full">
        <Image
          src="/banner-imobiliaria.jpg"
          alt="Banner Realiza Imóveis"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">
            Encontre o imóvel dos seus sonhos
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-200">
            Casas, apartamentos e terrenos selecionados com o padrão Realiza Imóveis.
          </p>
          <Link
            href="/imoveis"
            className="mt-8 bg-accent text-accent-foreground px-8 py-3 rounded-md text-lg font-semibold hover:opacity-90 transition"
          >
            Ver Imóveis
          </Link>
        </div>
      </div>

      {/* Seção de destaque */}
      <div className="max-w-7xl mx-auto py-20 px-6 grid md:grid-cols-3 gap-8">
        {[
          {
            img: "/imovel1.jpg",
            title: "Casas de Alto Padrão",
            desc: "Projetos modernos com conforto e sofisticação em cada detalhe.",
          },
          {
            img: "/imovel2.jpg",
            title: "Apartamentos Prontos",
            desc: "Unidades em localizações privilegiadas, prontas para morar.",
          },
          {
            img: "/imovel3.jpg",
            title: "Terrenos e Lotes",
            desc: "Espaços ideais para construir e investir no seu futuro.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="relative w-full h-56">
              <Image
                src={item.img}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {item.title}
              </h3>
              <p className="text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
