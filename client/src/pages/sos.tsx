import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Phone, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { EmergencyContact, SosAlert } from "@shared/schema";

export default function SOS() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const { data: contacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ['/api/emergency-contacts'],
  });

  const { data: sosAlerts = [] } = useQuery<SosAlert[]>({
    queryKey: ['/api/sos-alerts'],
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/emergency-contacts', {
        name,
        phone,
        relationship,
        isPrimary: contacts.length === 0 ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      setName("");
      setPhone("");
      setRelationship("");
      toast({
        title: "Contact added",
        description: "Emergency contact saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/emergency-contacts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      toast({
        title: "Contact deleted",
        description: "Emergency contact removed.",
      });
    },
  });

  const triggerSosMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sos-trigger', {
        location: "Current location",
        severity: "high",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sos-alerts'] });
      
      contacts.forEach(contact => {
        if (contact.phone) {
          console.log(`Emergency alert sent to ${contact.name}: ${contact.phone}`);
        }
      });

      toast({
        title: "SOS Alert Triggered",
        description: `Emergency contacts notified. ${contacts.filter(c => c.isPrimary).length} primary contact alerted.`,
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger SOS",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-sos">Emergency SOS</h1>
        <p className="text-muted-foreground">Manage emergency contacts and trigger alerts</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Quick SOS Alert
          </CardTitle>
          <CardDescription>Notify all emergency contacts immediately</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => triggerSosMutation.mutate()}
            disabled={triggerSosMutation.isPending || contacts.length === 0}
            variant="destructive"
            size="lg"
            className="w-full h-14 text-lg"
            data-testid="button-trigger-sos"
          >
            {triggerSosMutation.isPending ? "Triggering..." : "TRIGGER SOS"}
          </Button>
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">Add emergency contacts first</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
          <CardDescription>Contacts to notify in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No emergency contacts added yet</p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`contact-item-${contact.id}`}
                >
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </p>
                    {contact.relationship && (
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteContactMutation.mutate(contact.id)}
                    data-testid={`button-delete-contact-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-contact-name"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-contact-phone"
            />
          </div>
          <div>
            <Label htmlFor="relationship">Relationship</Label>
            <Input
              id="relationship"
              placeholder="Family member, Friend, etc."
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              data-testid="input-contact-relationship"
            />
          </div>
          <Button
            onClick={() => addContactMutation.mutate()}
            disabled={!name || !phone || addContactMutation.isPending}
            className="w-full"
            data-testid="button-add-contact"
          >
            {addContactMutation.isPending ? "Adding..." : "Add Contact"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
