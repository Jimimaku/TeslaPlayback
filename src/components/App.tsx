import { MailIcon, MarkGithubIcon } from "@primer/octicons-react";
import { BaseStyles, Box, Header, Heading, Text, ThemeProvider } from "@primer/react";
import { useState } from "react";
import stepsDiagram from "../assets/steps.png";
import { DashCamBrowser } from "./DashCamBrowser";
import { DemoVideoLoader } from "./DemoVideoLoader";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadFilesButton } from "./LoadFilesButton";

export function App() {
  const [fileList, setFileList] = useState<FileListLike | null>(null);

  const loadFilesButton = (
    <LoadFilesButton
      onLoad={setFileList}
      selectDir
      inputProps={{
        multiple: true,
        accept: "video/mp4,video/x-m4v,video/*",
      }}
    >
      Load from Tesla USB drive
    </LoadFilesButton>
  );

  return (
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        <Box display="flex" flexDirection="column" sx={{ gap: 0 }} bg={"canvas.default"}>
          <Header sx={{ whiteSpace: "nowrap", flexWrap: "wrap" }}>
            <Heading as={"h1"} sx={{ fontSize: 24, marginRight: 2 }}>
              Tesla Playback
            </Heading>
            <Header.Item>
              <Text sx={{ marginTop: "8px", fontSize: 12 }}>View, trim, merge, and export Tesla DashCam video.</Text>
            </Header.Item>
            <Header.Item full />
            <Header.Item>
              <Text>Crafted by EnixCoda</Text>
              <Header.Link sx={{ marginLeft: 2 }} target="_blank" href="https://github.com/EnixCoda" title="GitHub">
                <MarkGithubIcon />
              </Header.Link>
              <Header.Link sx={{ marginLeft: 2 }} target="_blank" href="mailto:enixcoda@gmail.com" title="Feedback">
                <MailIcon />
              </Header.Link>
            </Header.Item>
          </Header>
          <Box
            as="section"
            display="inline-flex"
            flexDirection="column"
            padding={3}
            overflow="auto"
            sx={{ gap: 3, ["--available-height"]: "calc(100vh - 68px)" }}
          >
            <ErrorBoundary>
              {fileList && fileList.length > 0 ? (
                <>
                  <Box>{loadFilesButton}</Box>
                  <DashCamBrowser fileList={fileList} />
                </>
              ) : (
                <Box display="inline-flex" flexDirection="column" maxWidth={640} sx={{ gap: 2 }}>
                  <img src={stepsDiagram} alt="Steps to use Tesla Playback" />
                  <Box display="flex" flexDirection="row" sx={{ gap: 2, alignItems: "center" }}>
                    {loadFilesButton}
                    <DemoVideoLoader setFileList={setFileList} />
                  </Box>
                  <Box>
                    <Heading as="h2" sx={{ fontSize: 2, margin: 1 }}>
                      Note
                    </Heading>
                    <Text as="p" sx={{ marginTop: 0 }}>
                      All video files will be processed locally offline. No files will be uploaded. If your browser prompts about uploading files,
                      please ignore it. For additional security, you may disconnect from internet before you proceed.
                    </Text>
                  </Box>
                </Box>
              )}
            </ErrorBoundary>
          </Box>
        </Box>
      </BaseStyles>
    </ThemeProvider>
  );
}
