type Props = { id?: string; className?: string; label?: string };

export default function AdSlot({ id, className, label }: Props) {
  return (
    <div
      id={id}
      className={className}
      style={{
        border: "1px dashed #999",
        borderRadius: 10,
        padding: 14,
        margin: "12px 0",
        textAlign: "center",
        opacity: 0.85,
        fontSize: 14,
      }}
    >
      {label ?? "ESPAÇO PARA ANÚNCIO (responsivo)"}
    </div>
  );
}
