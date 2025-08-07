import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SimpleHomeCarsSection = memo(() => {
  const navigate = useNavigate();

  return (
    <section id="cars" className="py-4 sm:py-6 lg:py-8 bg-secondary/30">
      <div className="container-responsive">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
            Makinat e Disponueshme
          </h2>
          <p className="text-muted-foreground">
            Test version - Navigation context working properly
          </p>
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate("/catalog")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
          >
            Shfleto të gjitha makinat
          </Button>
        </div>
      </div>
    </section>
  );
});

SimpleHomeCarsSection.displayName = "SimpleHomeCarsSection";
export default SimpleHomeCarsSection;