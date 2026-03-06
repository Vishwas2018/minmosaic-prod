-- 012_transitions.sql
-- State machine enforcement via trigger

CREATE FUNCTION validate_attempt_transition()
RETURNS trigger AS $$
BEGIN
  -- Allow if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transition
  IF NOT (
    -- created → started
    (OLD.status = 'created'     AND NEW.status = 'started')
    -- started → in_progress
    OR (OLD.status = 'started'  AND NEW.status = 'in_progress')
    -- started/in_progress → submitted
    OR (OLD.status IN ('started', 'in_progress') AND NEW.status = 'submitted')
    -- started/in_progress → expired
    OR (OLD.status IN ('started', 'in_progress') AND NEW.status = 'expired')
    -- started/in_progress → abandoned
    OR (OLD.status IN ('started', 'in_progress') AND NEW.status = 'abandoned')
    -- submitted → scored
    OR (OLD.status = 'submitted' AND NEW.status = 'scored')
    -- expired → submitted (server auto-submit)
    OR (OLD.status = 'expired' AND NEW.status = 'submitted')
    -- any non-terminal → invalidated
    OR (NEW.status = 'invalidated' AND OLD.status NOT IN ('scored', 'expired', 'abandoned', 'invalidated'))
  ) THEN
    RAISE EXCEPTION 'Invalid attempt status transition: % → %', OLD.status, NEW.status;
  END IF;

  -- Auto-set updated_at
  NEW.updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attempt_transition
  BEFORE UPDATE OF status ON attempts
  FOR EACH ROW EXECUTE FUNCTION validate_attempt_transition();
