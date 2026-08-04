export function Button(props: {
  onClick: () => void;
  name: string;
  id: string;
}): null {
  return null;
}

export function Demo(): null {
  return (
    <Button
      onClick={() => undefined}
      name="ok"
      id="btn"
    />
  );
}
