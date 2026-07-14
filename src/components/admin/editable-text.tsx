import { useState } from "react";
import { Pencil } from "lucide-react";
import { Reveal } from "@/components/motion";
import { useSiteText, useUpdateSiteText } from "@/api/site-texts";
import { useAuth } from "@/lib/auth";
import {
  HeroBlockHeader,
  HeroEyebrow,
  HeroLead,
  HeroScrollChevron,
  HeroTitle,
} from "@/components/public/hero-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditableTextProps = {
  textKey: string;
  fallback?: string;
  label?: string;
  multiline?: boolean;
  as?: "span" | "p" | "div";
  className?: string;
};

export function EditableText({
  textKey,
  fallback,
  label = "Modifier le texte",
  multiline = false,
  as: Tag = "span",
  className,
}: EditableTextProps) {
  const { user, canWrite } = useAuth();
  const value = useSiteText(textKey, fallback);
  const updateText = useUpdateSiteText();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const editable = Boolean(user && canWrite);

  const openEditor = () => {
    setDraft(value);
    setOpen(true);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Le texte ne peut pas être vide.");
      return;
    }
    try {
      await updateText.mutateAsync({ key: textKey, value: trimmed });
      toast.success("Texte mis à jour");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  if (!editable) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <>
      <Tag
        className={cn(
          "group/edit relative cursor-pointer rounded-sm transition",
          "hover:bg-forest/5 hover:outline hover:outline-1 hover:outline-forest/25",
          className,
        )}
        onClick={openEditor}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openEditor();
          }
        }}
        role="button"
        tabIndex={0}
        title="Cliquer pour modifier"
      >
        {value}
        <Pencil className="ml-1.5 inline h-3.5 w-3.5 opacity-0 transition group-hover/edit:opacity-60" />
      </Tag>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor={`edit-${textKey}`} className="sr-only">
              {label}
            </Label>
            {multiline ? (
              <Textarea
                id={`edit-${textKey}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                className="resize-y"
              />
            ) : (
              <Input
                id={`edit-${textKey}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void save()} disabled={updateText.isPending}>
              {updateText.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type EditableBlockHeaderProps = {
  eyebrow?: string;
  eyebrowKey?: string;
  title: string;
  titleKey: string;
  subtitle?: string;
  subtitleKey?: string;
  align?: "left" | "center";
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
  showChevron?: boolean;
};

export function EditableBlockHeader({
  eyebrow,
  eyebrowKey,
  title,
  titleKey,
  subtitle,
  subtitleKey,
  align = "center",
  className,
  titleAs = "h2",
  showChevron,
}: EditableBlockHeaderProps) {
  const { user, canWrite } = useAuth();
  const titleText = useSiteText(titleKey, title);
  const subtitleText = useSiteText(subtitleKey ?? "", subtitle);
  const eyebrowText = useSiteText(eyebrowKey ?? "", eyebrow);

  if (!user || !canWrite) {
    return (
      <HeroBlockHeader
        eyebrow={eyebrowKey ? eyebrowText : eyebrow}
        title={titleText}
        subtitle={subtitleKey ? subtitleText : subtitle}
        align={align}
        className={className}
        titleAs={titleAs}
        showChevron={showChevron}
      />
    );
  }

  const centered = align === "center";
  const displayChevron = showChevron ?? !!eyebrow;

  return (
    <Reveal className={cn(centered && "text-center", className)}>
      {(eyebrow || eyebrowKey) && (
        <HeroEyebrow>
          {eyebrowKey ? (
            <EditableText textKey={eyebrowKey} fallback={eyebrow} label="Modifier le sur-titre" />
          ) : (
            eyebrow
          )}
        </HeroEyebrow>
      )}
      {displayChevron && centered && (
        <div className={cn("flex justify-center", eyebrow ? "mt-2" : "mb-3")}>
          <HeroScrollChevron />
        </div>
      )}
      <HeroTitle as={titleAs} className={cn("text-forest", eyebrow && "mt-4")}>
        <EditableText textKey={titleKey} fallback={title} label="Modifier le titre" />
      </HeroTitle>
      {(subtitle || subtitleKey) && (
        <HeroLead className={cn("mt-4 max-w-2xl", centered && "mx-auto")}>
          {subtitleKey ? (
            <EditableText
              textKey={subtitleKey}
              fallback={subtitle}
              label="Modifier le sous-titre"
              multiline
              as="span"
            />
          ) : (
            subtitle
          )}
        </HeroLead>
      )}
    </Reveal>
  );
}
