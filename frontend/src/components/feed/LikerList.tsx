export type LikerPreview = {
  id: string;
  firstName: string;
  lastName: string;
};

type LikerListProps = {
  users: LikerPreview[];
};

/** Shows first + last names of users who liked a post or comment. */
export function LikerList({ users }: LikerListProps) {
  if (users.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">Liked by </span>
      {users.map((u, i) => (
        <span key={u.id}>
          {i > 0 ? ", " : ""}
          {u.firstName} {u.lastName}
        </span>
      ))}
    </p>
  );
}
