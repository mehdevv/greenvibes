import { Reveal } from "@/components/motion";
import { EditableImage } from "@/components/admin/editable-image";
import { AddPresentationBlockButton } from "@/components/admin/add-presentation-block";
import { EditableBlockHeader, EditableText } from "@/components/admin/editable-text";
import { MediaOrderControls } from "@/components/admin/media-order-controls";
import {
  presentationLayoutKey,
  useMergedPresentationBlocks,
  useRemovePresentationBlock,
  type PresentationSectionItem,
} from "@/api/site-content";
import {
  useHideMediaLayout,
  useReorderMediaLayout,
} from "@/api/site-media-layout";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  HeroContainer,
  HeroLead,
  HeroMediaFrame,
  HeroSection,
  HeroTitle,
} from "@/components/public/hero-ui";
import { toast } from "sonner";

function formatSectionNum(index: number) {
  return String(index + 1).padStart(2, "0");
}

function PresentationRow({
  block,
  index,
  total,
  canEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: PresentationSectionItem;
  index: number;
  total: number;
  canEdit: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const num = formatSectionNum(index);
  const imageLeft = index % 2 === 0;

  return (
    <div
      className={cn(
        "group relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24",
        !imageLeft && "lg:[&>div:first-child]:order-2",
      )}
    >
      {canEdit && (
        <MediaOrderControls
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          deleteLabel={
            block.bundled
              ? "Masquer cette section du site ?"
              : "Supprimer définitivement cette section ?"
          }
        />
      )}

      <HeroMediaFrame decor={false}>
        <EditableImage
          slot={block.imageSlot}
          fallback={block.imageFallback}
          alt=""
          className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
          loading="lazy"
        />
      </HeroMediaFrame>

      <div className="relative px-2 lg:px-6">
        <span
          className="pointer-events-none absolute -top-6 right-0 select-none font-display text-[5rem] font-bold leading-none text-forest/8 md:text-[7rem] lg:-top-10"
          aria-hidden
        >
          {num}
        </span>
        <HeroTitle as="h3" className="relative text-forest md:text-3xl">
          {block.titleKey ? (
            <EditableText textKey={block.titleKey} fallback={block.title} label="Modifier le titre" />
          ) : (
            block.title
          )}
        </HeroTitle>
        <HeroLead className="relative mt-4">
          {block.textKey ? (
            <EditableText
              textKey={block.textKey}
              fallback={block.body}
              label="Modifier le texte"
              multiline
              as="span"
            />
          ) : (
            block.body
          )}
        </HeroLead>
      </div>
    </div>
  );
}

export function ServicesSection() {
  const { user, canWrite } = useAuth();
  const blocks = useMergedPresentationBlocks();
  const removeBlock = useRemovePresentationBlock();
  const reorder = useReorderMediaLayout();
  const hideMedia = useHideMediaLayout();
  const canEdit = Boolean(user && canWrite);

  const nextImageLeft = blocks.length % 2 === 0;

  const moveBlock = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    try {
      await reorder.mutateAsync(next.map((b) => presentationLayoutKey(b.id)));
      toast.success("Ordre des sections mis à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteBlock = async (block: PresentationSectionItem) => {
    try {
      if (block.bundled) {
        await hideMedia.mutateAsync(presentationLayoutKey(block.id));
      } else if (block.dbId) {
        await removeBlock.mutateAsync(block.dbId);
      }
      toast.success("Section retirée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <HeroSection tone="white">
      <HeroContainer>
        <EditableBlockHeader
          eyebrow="Nos sorties"
          eyebrowKey="services.eyebrow"
          title="Comment on voyage ensemble"
          titleKey="services.title"
          subtitle="Simple, local et convivial — c'est notre façon de te faire découvrir la Petite Kabylie."
          subtitleKey="services.subtitle"
        />

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-28 lg:space-y-32">
          {blocks.map((block, i) => (
            <Reveal key={block.id} delay={i * 0.08}>
              <PresentationRow
                block={block}
                index={i}
                total={blocks.length}
                canEdit={canEdit}
                onMoveUp={() => void moveBlock(i, -1)}
                onMoveDown={() => void moveBlock(i, 1)}
                onDelete={() => void deleteBlock(block)}
              />
            </Reveal>
          ))}
        </div>

        {canEdit && (
          <div className="flex justify-center">
            <AddPresentationBlockButton imageLeftDefault={nextImageLeft} />
          </div>
        )}
      </HeroContainer>
    </HeroSection>
  );
}
