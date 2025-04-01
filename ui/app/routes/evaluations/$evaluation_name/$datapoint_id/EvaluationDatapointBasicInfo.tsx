import { useConfig } from "~/context/config";
import {
  BasicInfoLayout,
  BasicInfoItem,
  BasicInfoItemTitle,
  BasicInfoItemContent,
} from "~/components/layout/BasicInfoLayout";
import Chip from "~/components/ui/Chip";
import { getFunctionTypeIcon } from "~/utils/icon";
import type { StaticEvaluationConfig } from "~/utils/config/evaluations";

interface BasicInfoProps {
  evaluation_name: string;
  evaluation_config: StaticEvaluationConfig;
}

export default function BasicInfo({
  evaluation_name,
  evaluation_config,
}: BasicInfoProps) {
  const config = useConfig();

  const functionName = evaluation_config.function_name;
  const functionConfig = config.functions[functionName];
  const functionType = functionConfig?.type;
  const functionIconConfig = getFunctionTypeIcon(functionType);

  const datasetName = evaluation_config.dataset_name;

  return (
    <BasicInfoLayout>
      <BasicInfoItem>
        <BasicInfoItemTitle>Evaluation</BasicInfoItemTitle>
        <BasicInfoItemContent>
          <Chip
            label={evaluation_name}
            link={`/evaluations/${evaluation_name}`}
            font="mono"
          />
        </BasicInfoItemContent>
      </BasicInfoItem>
      <BasicInfoItem>
        <BasicInfoItemTitle>Function</BasicInfoItemTitle>
        <BasicInfoItemContent>
          <Chip
            icon={functionIconConfig.icon}
            iconBg={functionIconConfig.iconBg}
            label={functionName}
            secondaryLabel={`· ${functionType}`}
            link={`/observability/functions/${functionName}`}
            font="mono"
          />
        </BasicInfoItemContent>
      </BasicInfoItem>

      <BasicInfoItem>
        <BasicInfoItemTitle>Dataset</BasicInfoItemTitle>
        <BasicInfoItemContent>
          <Chip
            label={datasetName}
            link={`/datasets/${datasetName}`}
            font="mono"
          />
        </BasicInfoItemContent>
      </BasicInfoItem>
    </BasicInfoLayout>
  );
}
