import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractPythonCode } from '@/lib/llm-caller';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model = 'gpt-4o', modelApiKey, e2bApiKey } = body;

    const userE2bKey = e2bApiKey || process.env.E2B_API_KEY;
    const userModelKey = modelApiKey;

    // 1. E2B API Key 누락 체크
    if (!userE2bKey || userE2bKey.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'MISSING_E2B_KEY',
        agentInsight: '⚠️ **E2B API Key가 입력되지 않았습니다.**\n\n상단 우측 **[모델 & API 설정]** 버튼을 눌러 발급받으신 `E2B_API_KEY`를 입력해주세요.\n(E2B 클라우드 리눅스 MicroVM에서 Python 코드를 안전하게 실행하기 위해 필수입니다.)',
        charts: [],
        logs: { stdout: [], stderr: ['E2B_API_KEY is missing.'] },
        generatedCode: '',
        executionTimeMs: 0,
      });
    }

    // 2. 모델 API Key 누락 체크
    if (!userModelKey || userModelKey.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'MISSING_MODEL_KEY',
        agentInsight: `⚠️ **${model} API Key가 입력되지 않았습니다.**\n\n상단 우측 **[모델 & API 설정]** 버튼을 눌러 선택하신 **${model}**의 API Key를 등록해주세요.\n(AI가 사용자의 질문을 분석하여 맞춤형 Python 코드를 동적으로 작성하기 위해 필요합니다.)`,
        charts: [],
        logs: { stdout: [], stderr: [`${model} API key is missing.`] },
        generatedCode: '',
        executionTimeMs: 0,
      });
    }

    const startTime = Date.now();

    // 3. 1단계: LLM 호출하여 질문에 맞는 파이썬 퀀트 코드 동적 생성
    const codeGenSystemPrompt = `You are an expert quantitative finance data analyst and Python programmer.
Your job is to write a standalone, executable Python script to answer the user's financial question about the 5 major stock market indices.

The index ticker symbols for yfinance are:
- S&P 500: '^GSPC'
- NASDAQ Composite: '^IXIC'
- Russell 2000: '^RUT'
- KOSPI: '^KS11'
- KOSDAQ: '^KQ11'

Rules:
1. Always import yfinance as yf, pandas as pd, numpy as np, matplotlib.pyplot as plt.
2. Download historical data using yf.download() with period='3mo' or '6mo' or '1y' based on the user question.
3. Clean missing values with .ffill().dropna().
4. Print clear, formatted statistics and tables using print() so they appear in stdout.
5. Create a visually polished dark-background plot using matplotlib / seaborn:
   plt.style.use('dark_background')
   fig.patch.set_facecolor('#0f172a')
   plt.tight_layout()
   plt.show()
6. Output ONLY executable Python code within \`\`\`python code block. No explanations or chit-chat.`;

    const rawGeneratedCode = await callLLM({
      model,
      apiKey: userModelKey,
      systemPrompt: codeGenSystemPrompt,
      userPrompt: `User question: "${prompt}". Generate Python code to analyze and plot this.`,
    });

    const pythonCode = extractPythonCode(rawGeneratedCode);

    // 4. 2단계: 실제 E2B 클라우드 샌드박스(MicroVM) 생성 및 코드 실행
    let sandbox: any = null;
    let stdoutLogs: string[] = [];
    let stderrLogs: string[] = [];
    const charts: string[] = [];

    try {
      const { Sandbox } = await import('@e2b/code-interpreter');
      sandbox = await Sandbox.create({
        apiKey: userE2bKey,
        timeoutMs: 60_000,
      });

      const execution = await sandbox.runCode(pythonCode);

      if (execution.logs?.stdout) stdoutLogs.push(...execution.logs.stdout);
      if (execution.logs?.stderr) stderrLogs.push(...execution.logs.stderr);

      if (execution.results && execution.results.length > 0) {
        for (const res of execution.results) {
          if (res.png) {
            charts.push(`data:image/png;base64,${res.png}`);
          } else if (res.svg) {
            charts.push(`data:image/svg+xml;utf8,${encodeURIComponent(res.svg)}`);
          }
        }
      }
    } finally {
      if (sandbox) {
        try {
          await sandbox.kill();
        } catch (e) {
          // ignore cleanup error
        }
      }
    }

    // 5. 3단계: E2B stdout 실행 결과를 LLM에 전달하여 한국어 인사이트 리포트 생성
    const reportSystemPrompt = `You are a chief market strategist and quantitative financial analyst.
You are given:
1. The user's original query.
2. The stdout execution output from running python data analysis in a cloud sandbox on 5 major stock indices (S&P 500, NASDAQ, Russell 2000, KOSPI, KOSDAQ).

Write a clear, highly professional, insightful financial report in Korean (한국어).
Use clean markdown headers (###), bullet points, and highlight key numbers in bold.
Provide strategic interpretation, risk analysis, and actionable takeaways based strictly on the actual numbers returned from the sandbox.`;

    const combinedOutput = stdoutLogs.join('\n');
    const finalReport = await callLLM({
      model,
      apiKey: userModelKey,
      systemPrompt: reportSystemPrompt,
      userPrompt: `User Query: "${prompt}"\n\nExecution stdout results from E2B Sandbox:\n${combinedOutput || '(No stdout text, chart generated)'}`,
    });

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      isMock: false,
      agentInsight: finalReport,
      charts,
      logs: {
        stdout: stdoutLogs,
        stderr: stderrLogs,
      },
      generatedCode: pythonCode,
      executionTimeMs,
      model,
    });
  } catch (error: any) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Execution error',
        agentInsight: `### ❌ 실행 중 오류가 발생했습니다.\n\n${error.message || error}`,
        charts: [],
        logs: { stdout: [], stderr: [String(error)] },
        generatedCode: '',
        executionTimeMs: 0,
      },
      { status: 200 } // 프론트엔드에서 파싱할 수 있도록 200으로 반환
    );
  }
}
