import { Button, Icon, Input, Space, withField } from "@douyinfe/semi-ui";
import { open } from "@tauri-apps/api/dialog";
import { type FunctionComponent, memo, useCallback } from "react";

import SolarFileSendOutline from "~icons/solar/file-send-outline";

export type FilePickerProps = {
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  multiple?: boolean;
};

const InternalFilePicker: FunctionComponent<FilePickerProps> = ({ value, onChange, multiple = false }) => {
  const handlePickFiles = useCallback(async () => {
    const selected = await open({
      multiple,
      directory: false,
    });

    onChange?.(selected ?? undefined);
  }, [multiple, onChange]);

  return (
    <Space className="w-full">
      <Input readOnly value={Array.isArray(value) ? value.join(", ") : value} />

      <Button
        icon={
          <Icon svg={<SolarFileSendOutline />} />
        }
        theme="solid"
        onClick={handlePickFiles}
      >
        选择文件
      </Button>
    </Space>
  );
};

const FilePicker = memo(InternalFilePicker);
export default FilePicker;

const FormFilePicker = withField(InternalFilePicker, {
  valueKey: "value",
  onKeyChangeFnName: "onChange",
  shouldMemo: true,
});

export {
  FormFilePicker,
};
