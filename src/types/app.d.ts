export {};
declare global {
  type HospitalSettings = {
    id: string;
    name: string;
    mainServerIp: string;
    databaseServerIp: string;
    redisServerIp: string;
    minioServerIp: string;
    reportServerIp: string;
    filePreviewServerIp: string;
    dashboardServerIp: string;
    bigScreenServerIp: string;
  };

  type ServerSettings = {
    id: string;
    hospitalId: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
  };

  type FlowDefinition = {
    name: string;
    description: string;
    icon: string;
    parameters: FlowParameter[];
    steps: FlowStepDefinition[];
  };

  type FlowParameter = {
    name: string;
    label: string;
    type: "text" | "number" | "file";
    required: boolean;
    multiple: boolean;
  };

  type FlowStepDefinition = {
    type: string;
    name: string;
    condition: string | null;
    command: string;
    package: string | null;
    targetFile: string | null;
    sourceFileParamName: string | null;
    sourceFile: string | null;
    targetDir: string | null;
  };

  type ProgressReporterEvent = {
    totalSize: number;
    totalSizeFormat: string;
    processedSize: number;
    processedSizeFormat: string;
    progressPercent: number;
  };
}
