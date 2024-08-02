import { Card } from "@douyinfe/semi-ui";
import type { Ellipsis } from "@douyinfe/semi-ui/lib/es/typography";
import Text from "@douyinfe/semi-ui/lib/es/typography/text";
import { type FunctionComponent, memo, type MouseEventHandler, type ReactNode } from "react";

export type FlowCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const ellipsisConfig: Ellipsis = {
  rows: 2,
};
const InternalFlowCard: FunctionComponent<FlowCardProps> = props => {
  const { title, description, icon, onClick } = props;

  return (
    <div onClick={onClick}>
      <Card bordered={false} className="bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-500" shadows="hover">
        <Card.Meta
          avatar={(
            <span className="text-6xl text-indigo-500">
              {icon}
            </span>
          )}
          description={(
            <div className="h-12 overflow-hidden">
              <Text className=" text-slate-500" ellipsis={ellipsisConfig}>
                {description}
              </Text>
            </div>
          )}
          title={
            <span className="text-indigo-500">{title}</span>
          }
        />
      </Card>
    </div>
  );
};

const FlowCard = memo(InternalFlowCard);
export default FlowCard;
