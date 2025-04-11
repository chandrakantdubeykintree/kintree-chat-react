import { useFamily } from "@/hooks/useFamily";
import AsyncComponent from "../components/async-component";
import Tree from "../components/tree";
import ComponentLoading from "../components/component-loading";

export default function FamilyTree() {
  const { data, isLoading } = useFamily();

  if (isLoading) {
    return <ComponentLoading />;
  }

  return (
    <AsyncComponent>
      <Tree nodes={data} />
    </AsyncComponent>
  );
}
