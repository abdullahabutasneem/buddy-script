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
    <p className="_feed_inner_timeline_post_box_para _mar_t8" style={{ marginBottom: 0 }}>
      <span style={{ fontWeight: 500 }}>Liked by </span>
      {users.map((u, i) => (
        <span key={u.id}>
          {i > 0 ? ", " : ""}
          {u.firstName} {u.lastName}
        </span>
      ))}
    </p>
  );
}
