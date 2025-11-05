import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Warranty = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-responsive py-8 space-y-6">
        <Card className="shadow-md border-border/70">
          <CardHeader>
            <CardTitle>Garancioni KORAUTO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Garancioni ynë mbulon komponentët kryesorë mekanikë dhe elektrikë të
              automjetit, sipas kushteve të përcaktuara më poshtë. Qëllimi është t'ju
              ofrojë qetësi dhe transparencë pas blerjes.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Çfarë mbulohet</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Motori (blloku i motorit, kokat, komponentët e brendshëm)</li>
                <li>Kutia e shpejtësive dhe transmisioni</li>
                <li>Diferenciali dhe sistemi i lëvizjes</li>
                <li>Sistemi i ftohjes dhe sistemi i karburantit</li>
                <li>Komponentë elektrikë kryesorë (alternatori, startuesi, ECU)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Çfarë nuk mbulohet</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pjesët konsumuese (frena, disqe, vajra, filtra, gomat)</li>
                <li>Zhurma, dridhje ose konsum normal</li>
                <li>Dëme nga aksidente, përmbytje, modifikime ose pakujdesi</li>
                <li>Shërbime rutinë dhe mirëmbajtje periodike</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Kushtet</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Garancioni është i vlefshëm vetëm me mirëmbajtje të rregullt</li>
                <li>Çdo riparim duhet të miratohet paraprakisht nga KORAUTO</li>
                <li>Afati dhe mbulimi mund të ndryshojnë sipas automjetit</li>
              </ul>
            </div>

            <p>
              Për pyetje ose sqarime, na kontaktoni direkt për të marrë një shpjegim të
              plotë rreth garancionit për makinën tuaj specifike.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Warranty;
