import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { useSubmitContact } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { PageIntro } from "@/components/public/page-intro";
import { Reveal } from "@/components/motion";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const submitContact = useSubmitContact();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitContact.mutateAsync(form);
      toast.success("Message envoyé ! Nous vous répondrons sous 24h.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    }
  };

  return (
    <PublicLayout>
      <PageIntro
        title="Contact"
        description="Basés à Béjaïa, nous organisons des circuits partout en Algérie. Écrivez-nous — nous répondons rapidement."
      >
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Reveal variant="fadeLeft">
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="" disabled={submitContact.isPending}>
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal variant="fadeRight" delay={0.1} className="space-y-6">
            <div className="rounded-md bg-secondary p-8">
              <h2 className="font-display text-xl font-bold text-foreground">Coordonnées</h2>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" /> Béjaïa, Algérie
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" /> +213 (0)00 00 00 00
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" /> hello@greenvibes.dz
                </li>
              </ul>
            </div>
            <iframe
              title="Notre siège à Béjaïa"
              src="https://www.openstreetmap.org/export/embed.html?bbox=5.0%2C36.72%2C5.12%2C36.78&layer=mapnik&marker=36.7525%2C5.0553"
              className="h-64 w-full rounded-md border border-border"
            />
          </Reveal>
        </div>
      </PageIntro>
    </PublicLayout>
  );
}
