
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Gauge, Fuel, Settings2, CheckCircle, Car } from 'lucide-react';
import { useState, useEffect } from 'react';
import auctionDataImport from '@/data/auctions.json';

// Type definition based on our scraped data
interface AuctionCar {
    id: string;
    stock_no: string;
    name: string;
    price: number;
    detail_url: string;
    make: string;
    model: string;
    images: string[];
    specs: Record<string, string>;
    options: string[];
    auction_date: string;
}

interface AuctionData {
    auctionSchedule: {
        weekNo: string;
        uploadTime: string | null;
        bidStartTime: string | null;
        bidEndTime: string | null;
        lastUpdated: string;
    };
    cars: AuctionCar[];
    totalCars: number;
    lastUpdated: string;
}

const AuctionCarDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [car, setCar] = useState<AuctionCar | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');

    useEffect(() => {
        if (id) {
            // @ts-ignore
            const auctionData = auctionDataImport as AuctionData;
            const foundCar = auctionData.cars.find((c) => c.id === id);
            if (foundCar) {
                setCar(foundCar as AuctionCar);
                if (foundCar.images && foundCar.images.length > 0) {
                    setSelectedImage(foundCar.images[0]);
                }
            }
        }
    }, [id]);

    if (!car) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Vetura nuk u gjet</h1>
                <Button onClick={() => navigate('/auctions')}>Kthehu te Ankandet</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <Button
                variant="ghost"
                onClick={() => navigate('/auctions')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kthehu te Lista
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Images */}
                <div className="space-y-4">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted relative">
                        {selectedImage ? (
                            <img
                                src={selectedImage}
                                alt={car.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Car className="h-16 w-16 text-muted-foreground" />
                            </div>
                        )}
                        <Badge className="absolute top-4 left-4 text-lg px-3 py-1">
                            #{car.stock_no}
                        </Badge>
                    </div>

                    {/* Thumbnails */}
                    {car.images.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {car.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all ${selectedImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                        }`}
                                >
                                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{car.name}</h1>
                        <div className="text-2xl font-bold text-primary">
                            ${car.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">(Oferta fillestare)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Viti</p>
                                    <p className="font-semibold">{car.specs['Year'] || car.specs['Model Year'] || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Gauge className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Kilometrazhi</p>
                                    <p className="font-semibold">{car.specs['Mileage'] || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Settings2 className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Transmisioni</p>
                                    <p className="font-semibold">{car.specs['Transmission'] || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Fuel className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Karburanti</p>
                                    <p className="font-semibold">{car.specs['Fuel'] || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Technical Specs Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="border-b p-4 font-semibold bg-muted/30">Specifikimet Teknike</div>
                            <div className="divide-y">
                                {Object.entries(car.specs).map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-4 text-sm">
                                        <span className="text-muted-foreground">{key}</span>
                                        <span className="font-medium text-right">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Options */}
                    {car.options && car.options.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Opsionet</h3>
                            <div className="flex flex-wrap gap-2">
                                {car.options.map((opt, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                        <CheckCircle className="mr-1.5 h-3 w-3 text-primary" />
                                        {opt}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuctionCarDetails;
