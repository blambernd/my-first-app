import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface ServiceReminderEmailProps {
  vehicleName: string;
  dueType: string;
  dueDate: string;
  daysRemaining: number;
}

export function ServiceReminderEmail({
  vehicleName,
  dueType,
  dueDate,
  daysRemaining,
}: ServiceReminderEmailProps) {
  const typeLabel = dueType === "tuv_hu" ? "TÜV/HU" : "Service";
  const urgency = daysRemaining <= 1 ? "morgen" : `in ${daysRemaining} Tagen`;

  return (
    <Html>
      <Head />
      <Preview>
        {`${typeLabel} für ${vehicleName} ${urgency} fällig`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Termin-Erinnerung</Heading>

          <Section style={alertBox}>
            <Text style={alertTitle}>{typeLabel}</Text>
            <Text style={alertDate}>{dueDate}</Text>
            <Text style={alertMeta}>{urgency} fällig</Text>
          </Section>

          <Text style={text}>
            Der nächste <strong>{typeLabel}</strong>-Termin für dein Fahrzeug{" "}
            <strong>{vehicleName}</strong> ist {urgency} am{" "}
            <strong>{dueDate}</strong> fällig.
          </Text>

          <Text style={text}>
            Vergiss nicht, rechtzeitig einen Termin zu vereinbaren.
          </Text>

          <Hr style={hr} />

          <Text style={footerText}>
            Du erhältst diese Erinnerung, weil du einen {typeLabel}-Termin in
            deinem Fahrzeug-Scheckheft eingetragen hast.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const alertBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
  borderLeft: "4px solid #f59e0b",
};

const alertTitle = {
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#92400e",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const alertDate = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const alertMeta = {
  fontSize: "14px",
  color: "#92400e",
  margin: "0",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footerText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#8a8a8a",
  margin: "0 0 8px",
};

export default ServiceReminderEmail;
