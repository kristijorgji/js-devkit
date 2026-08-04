type Props = { id: string; name: string; onClick: () => void };

export function Button(props: Props): null {
  return null;
}

export function Demo(rest: Props): null {
  return (
    <Button
      onClick={() => undefined}
      {...rest}
      name="ok"
      id="btn"
    />
  );
}
