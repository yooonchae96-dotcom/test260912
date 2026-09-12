// ===================================================
// Gemini API를 호출하는 Vercel 서버리스 함수
//
// 왜 서버가 필요한가요?
//   API 키를 브라우저 코드(app.js)에 적으면 누구나 볼 수 있습니다.
//   그래서 키는 서버에만 두고, 브라우저는 이 주소(/api/gemini)로 부탁만 합니다.
//
// 개인정보 보호:
//   학생 이름, uid, 이메일 등의 식별 정보는 Gemini로 전송하지 않고
//   오직 메모 텍스트 내용만 프롬프트에 포함합니다.
// ===================================================

export default async function handler(req, res) {
  // POST 요청만 허용합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Vercel 환경 변수에 GEMINI_API_KEY가 설정되어 있지 않습니다.'
    });
  }

  try {
    const { memos } = req.body || {};

    if (!memos || !Array.isArray(memos) || memos.length === 0) {
      return res.status(400).json({ error: '분석할 메모가 없습니다.' });
    }

    // 개인정보 보호: 식별 정보 없이 순수 텍스트만 프롬프트에 조립합니다.
    const memoTexts = memos.map((m, idx) => `${idx + 1}. ${m}`).join('\n');
    const prompt = `당신은 따뜻하고 격려하는 초등/중등 교사입니다. 아래는 학생들이 학급 담벼락에 작성한 메모들입니다. 이 메모들을 읽고 학급 전체에 대한 따뜻한 종합 피드백(총평)과 격려의 코멘트를 3~4문장 정도로 다정하게 작성해 주세요.\n\n[담벼락 메모 목록]\n${memoTexts}`;

    // Gemini 최신 무료 모델 API 호출 (기본값: gemini-2.0-flash)
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || 'Gemini API 호출에 실패했습니다.'
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '피드백을 생성하지 못했습니다.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
