type AISummaryContentProps = {
  content: string;
};

export const AISummaryContent = ({ content }: AISummaryContentProps) => {
  return (
    <div className="rounded-2xl bg-muted/40 p-5">
      <p className="leading-7 text-muted-foreground">{content}</p>
    </div>
  );
};
