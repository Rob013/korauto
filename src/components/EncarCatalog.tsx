// Temporary stub for EncarCatalog to fix build errors
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EncarCatalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-responsive py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Catalog</h1>
          <p className="text-muted-foreground">
            Catalog temporarily disabled for testing navigation context
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EncarCatalog;