import LibraryPage from "./LibraryPage";

type Props = {
  userRole?: string;
  userName?: string;
};

export default function FacultyLibraryPage({ userRole = "faculty", userName = "Faculty Member" }: Props) {
  return <LibraryPage userRole={userRole} userName={userName} />;
}
