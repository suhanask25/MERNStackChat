import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MapIcon, AlertCircle, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Hospital {
  id: string;
  name: string;
  distance: number;
  address: string;
  phone: string;
  emergency: boolean;
  rating: number;
}

const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "1",
    name: "City General Hospital",
    distance: 0.8,
    address: "123 Medical Ave, Downtown",
    phone: "+1 (555) 100-1000",
    emergency: true,
    rating: 4.8,
  },
  {
    id: "2",
    name: "Women's Health Center",
    distance: 1.2,
    address: "456 Health Blvd, Midtown",
    phone: "+1 (555) 200-2000",
    emergency: true,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Medical Care Clinic",
    distance: 1.5,
    address: "789 Care St, Uptown",
    phone: "+1 (555) 300-3000",
    emergency: false,
    rating: 4.5,
  },
  {
    id: "4",
    name: "Emergency Medical Center",
    distance: 2.1,
    address: "321 Emergency Lane, Industrial",
    phone: "+1 (555) 400-4000",
    emergency: true,
    rating: 4.7,
  },
];

export default function Hospitals() {
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>(MOCK_HOSPITALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmergency, setFilterEmergency] = useState(false);

  useEffect(() => {
    let filtered = MOCK_HOSPITALS;

    if (searchTerm) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEmergency) {
      filtered = filtered.filter(h => h.emergency);
    }

    setHospitals(filtered);
  }, [searchTerm, filterEmergency]);

  const handleGetDirections = (hospital: Hospital) => {
    toast({
      title: "Directions",
      description: `Opening directions to ${hospital.name}...`,
    });
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-hospitals">
          Nearby Hospitals
        </h1>
        <p className="text-muted-foreground">Find emergency medical facilities near you</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search hospitals by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-hospitals"
          />
          <div className="flex gap-2">
            <Button
              variant={filterEmergency ? "default" : "outline"}
              onClick={() => setFilterEmergency(!filterEmergency)}
              data-testid="button-filter-emergency"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Emergency Only
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {hospitals.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No hospitals found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          hospitals.map((hospital) => (
            <Card key={hospital.id} data-testid={`hospital-card-${hospital.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {hospital.name}
                      {hospital.emergency && (
                        <Badge variant="destructive" className="text-xs">
                          Emergency
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {hospital.distance} km away
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{hospital.rating}/5</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{hospital.address}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCall(hospital.phone)}
                    data-testid={`button-call-${hospital.id}`}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGetDirections(hospital)}
                    data-testid={`button-directions-${hospital.id}`}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
