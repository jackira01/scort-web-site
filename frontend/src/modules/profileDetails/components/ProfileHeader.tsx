export default function ProfielHeader({
  name,
  age,
  category,
}: {
  name: string;
  age: number;
  category: string;
}) {
  return (
    <div className="text-center animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        {name}
      </h2>
      <p className="text-muted-foreground">
        {age} años • {typeof category === 'object' && category !== null && 'label' in category ? (category as any).label : category}
      </p>
    </div>
  );
}
