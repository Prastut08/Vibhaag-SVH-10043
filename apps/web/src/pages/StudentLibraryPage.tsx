import LibraryPage from "./LibraryPage";

type Props = {
  userRole?: string;
  userName?: string;
};

export default function StudentLibraryPage({ userRole = "student", userName = "Student" }: Props) {
  return <LibraryPage userRole={userRole} userName={userName} />;
}
