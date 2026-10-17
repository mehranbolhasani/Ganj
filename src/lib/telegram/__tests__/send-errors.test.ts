import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GrammyError, HttpError } from 'grammy';
import { isPermanentSendError, logPermanentSendError } from '../send-errors';

function grammyError(
  code: number,
  description: string,
  payload: Record<string, unknown> = {}
): GrammyError {
  return new GrammyError(
    `Call to 'sendMessage' failed!`,
    { ok: false, error_code: code, description },
    'sendMessage',
    payload
  );
}

describe('isPermanentSendError', () => {
  it('detects bot blocked by the user (403)', () => {
    assert.equal(
      isPermanentSendError(grammyError(403, 'Forbidden: bot was blocked by the user')),
      true
    );
  });

  it('detects deactivated user (403)', () => {
    assert.equal(
      isPermanentSendError(grammyError(403, 'Forbidden: user is deactivated')),
      true
    );
  });

  it('detects chat not found (400)', () => {
    assert.equal(
      isPermanentSendError(grammyError(400, 'Bad Request: chat not found')),
      true
    );
  });

  it('does not treat other 400s as permanent', () => {
    assert.equal(
      isPermanentSendError(grammyError(400, 'Bad Request: message text is empty')),
      false
    );
  });

  it('does not treat 403 with an unrelated description as permanent', () => {
    assert.equal(
      isPermanentSendError(grammyError(403, 'Forbidden: bot was kicked from a group')),
      false
    );
  });

  it('does not treat 429 as permanent', () => {
    assert.equal(
      isPermanentSendError(grammyError(429, 'Too Many Requests: retry after 5')),
      false
    );
  });

  it('does not treat network errors as permanent', () => {
    assert.equal(isPermanentSendError(new HttpError('Network request failed', new Error('boom'))), false);
  });

  it('does not treat generic errors as permanent', () => {
    assert.equal(isPermanentSendError(new Error('something broke')), false);
    assert.equal(isPermanentSendError(undefined), false);
  });
});

describe('logPermanentSendError', () => {
  it('logs exactly one concise line with a hashed chat id and no message text', () => {
    const lines: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => lines.push(args);
    try {
      logPermanentSendError(
        grammyError(403, 'Forbidden: bot was blocked by the user', {
          chat_id: 987654321,
          text: 'سلام! این متن خصوصی است',
        })
      );
    } finally {
      console.error = original;
    }

    assert.equal(lines.length, 1);
    const line = String(lines[0][0]);
    assert.match(line, /code=403/);
    assert.match(line, /method=sendMessage/);
    assert.match(line, /reason=bot_blocked/);
    // Short hash of the chat id, not the raw id
    assert.doesNotMatch(line, /987654321/);
    assert.match(line, /chat=[0-9a-f]{8}/);
    // No message text and no personal data
    assert.equal(line.includes('متن'), false);
    assert.equal(line.includes('خطا'), false);
  });

  it('logs without a chat field when the payload has no chat id', () => {
    const lines: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => lines.push(args);
    try {
      logPermanentSendError(grammyError(400, 'Bad Request: chat not found'));
    } finally {
      console.error = original;
    }

    assert.equal(lines.length, 1);
    assert.doesNotMatch(String(lines[0][0]), /chat=/);
  });
});
