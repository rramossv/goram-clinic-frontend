interface ProximamentePageProps {
  titulo: string
}

export function ProximamentePage({ titulo }: ProximamentePageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground">Esta seccion todavia no esta construida.</p>
    </div>
  )
}
